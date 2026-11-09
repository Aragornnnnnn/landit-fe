// AI 발화 재생 훅 검증 — 오프닝 음원·합성 폴백·타이머 폴백과 다음 질문 프리페치
// @vitest-environment jsdom
import { EVENTS } from '@landit/analytics';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';
import { setSpeechRate } from '@/shared/lib/speech-rate';
import { TtsTimeoutError } from '@/shared/tts/useTts';
import type { TtsVoice } from '@/shared/tts/voice';

import { speechEndPauseMs, speechTypingMs } from './pacing';
import { useAiSpeech, type SpeechSource } from './useAiSpeech';

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

// TTS는 경계(재생)라 목으로 둔다 — speak/speakSrc의 onStart·onEnd·onError를 붙잡아 재생·종료·실패를 흉내 낸다
type FakePlayback = { progress: () => number; source: string };
const ttsMock = vi.hoisted(() => {
  const state = {
    onStart: undefined as ((playback: FakePlayback) => void) | undefined,
    onEnd: undefined as (() => void) | undefined,
    onError: undefined as ((error?: Error) => void) | undefined,
    onStall: undefined as ((snapshot: unknown) => void) | undefined,
    onResume: undefined as
      ((resume: { stalledMs: number }) => void) | undefined,
  };
  interface CapturedOptions {
    onStart?: (playback: FakePlayback) => void;
    onEnd?: () => void;
    onError?: (error?: Error) => void;
    onStall?: (snapshot: unknown) => void;
    onResume?: (resume: { stalledMs: number }) => void;
  }
  const capture = (opts?: CapturedOptions) => {
    state.onStart = opts?.onStart;
    state.onEnd = opts?.onEnd;
    state.onError = opts?.onError;
    state.onStall = opts?.onStall;
    state.onResume = opts?.onResume;
  };
  return {
    state,
    speak: vi.fn((_text: string, _voice: unknown, opts?: CapturedOptions) => {
      capture(opts);
      return Promise.resolve();
    }),
    speakSrc: vi.fn((_src: string, opts?: CapturedOptions) => {
      capture(opts);
    }),
    prefetch: vi.fn<(text: string, voice: unknown) => Promise<void>>(() =>
      Promise.resolve(),
    ),
    prefetchSrc: vi.fn(),
    stop: vi.fn(),
  };
});
vi.mock('@/shared/tts/useTts', () => ({
  TtsTimeoutError: class extends Error {},
  useTts: () => ({
    speak: ttsMock.speak,
    speakSrc: ttsMock.speakSrc,
    prefetch: ttsMock.prefetch,
    prefetchSrc: ttsMock.prefetchSrc,
    stop: ttsMock.stop,
    status: 'idle',
  }),
}));

const voice: TtsVoice = {
  provider: 'OPENROUTER',
  model: 'mai-voice',
  providerVoiceId: 'en-US-Ethan',
  gender: 'MALE',
};

const OPENING = 'Hello, welcome in.';

// 오프닝 발화가 재생 중인 상태로 렌더한다 — 이후 rerender로 발화 교체·중단을 흉내 낸다
const renderSpeech = (
  over: Partial<Parameters<typeof useAiSpeech>[0]> = {},
) => {
  const onSpeechEnd = vi.fn();
  const initialProps = {
    playing: true,
    source: { content: OPENING } as SpeechSource | null,
    voice: voice as TtsVoice | null,
    openingSrc: 'https://cdn.example.com/questions/10.mp3' as string | null,
    onSpeechEnd,
    ...over,
  };
  const hook = renderHook((props) => useAiSpeech(props), { initialProps });
  return { ...hook, onSpeechEnd, initialProps };
};

// 재생 호출 기록만 비운다 — track 같은 다른 목은 그대로 둔다
const clearTtsCalls = () => {
  ttsMock.speak.mockClear();
  ttsMock.speakSrc.mockClear();
  ttsMock.prefetch.mockClear();
  ttsMock.prefetchSrc.mockClear();
  ttsMock.stop.mockClear();
};

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  ttsMock.state.onStart = undefined;
  ttsMock.state.onEnd = undefined;
  ttsMock.state.onError = undefined;
  ttsMock.state.onStall = undefined;
  ttsMock.state.onResume = undefined;
  clearTtsCalls();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useAiSpeech', () => {
  it('오프닝은 서버가 준 음원으로 재생하고, 끝나면 종료를 알린다', async () => {
    const { onSpeechEnd } = renderSpeech();

    expect(ttsMock.speakSrc).toHaveBeenCalledWith(
      'https://cdn.example.com/questions/10.mp3',
      expect.anything(),
    );
    expect(ttsMock.speak).not.toHaveBeenCalled();

    await act(async () => ttsMock.state.onEnd?.());

    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('오프닝 음원이 없으면 파일 재생 없이 바로 합성으로 말한다', async () => {
    // 음원이 없는 대화(스몰톡, 음원 미등록 시나리오)는 처음부터 일반 재생 경로를 탄다
    const { onSpeechEnd } = renderSpeech({ openingSrc: null });

    expect(ttsMock.speakSrc).not.toHaveBeenCalled();
    expect(ttsMock.speak).toHaveBeenCalledWith(
      OPENING,
      voice,
      expect.anything(),
    );

    await act(async () => ttsMock.state.onEnd?.());
    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('오프닝 음원 재생이 실패하면 실패를 남기고 합성으로 폴백한다', async () => {
    const { onSpeechEnd } = renderSpeech();

    await act(async () => ttsMock.state.onError?.()); // 음원 못 받음(404·네트워크)

    expect(track).toHaveBeenCalledWith('Speech Playback Failed', {
      source: 'prerecorded',
    });
    expect(ttsMock.speak).toHaveBeenCalledWith(
      OPENING,
      voice,
      expect.anything(),
    );

    await act(async () => ttsMock.state.onEnd?.());

    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('음원도 음성도 없으면 글자 수 타이머로 발화를 마친다', async () => {
    const { onSpeechEnd } = renderSpeech({ voice: null });

    await act(async () => ttsMock.state.onError?.()); // 음원 못 받음

    expect(ttsMock.speak).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(speechTypingMs(OPENING) + speechEndPauseMs);
    });

    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('말하기 속도를 느리게 골라두면 타이머 폴백도 그만큼 길게 기다린다', async () => {
    setSpeechRate(0.75);
    const { onSpeechEnd } = renderSpeech({ voice: null });

    await act(async () => ttsMock.state.onError?.()); // 음원 못 받음

    // 1배 기준 시간이 지나도 아직 말하는 중이다
    await act(async () => {
      vi.advanceTimersByTime(speechTypingMs(OPENING) + speechEndPauseMs);
    });
    expect(onSpeechEnd).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(speechTypingMs(OPENING));
    });
    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('markOpeningPlayed 이후의 발화는 오프닝 음원이 아니라 합성으로 재생한다', async () => {
    const { result, rerender, onSpeechEnd, initialProps } = renderSpeech();
    await act(async () => ttsMock.state.onEnd?.()); // 오프닝 재생 종료

    act(() => result.current.markOpeningPlayed());
    rerender({
      ...initialProps,
      source: { content: 'What size would you like?' },
    });

    expect(ttsMock.speak).toHaveBeenCalledWith(
      'What size would you like?',
      voice,
      expect.anything(),
    );
    expect(ttsMock.speakSrc).toHaveBeenCalledTimes(1); // 음원 재생은 오프닝 한 번뿐

    await act(async () => ttsMock.state.onEnd?.());
    expect(onSpeechEnd).toHaveBeenCalledTimes(2);
  });

  it('재생 중 발화 단계를 벗어나면 재생을 멈춘다', async () => {
    const { rerender, initialProps } = renderSpeech();

    rerender({ ...initialProps, playing: false });

    expect(ttsMock.stop).toHaveBeenCalled();
  });

  it('발화 단계를 벗어난 뒤 도착한 오프닝 실패는 실패로 세지도, 재생을 되살리지도 않는다', async () => {
    // 정리(cleanup)가 끝난 뒤 mp3 실패가 뒤늦게 도착하면, 폴백을 시작할 주체가 이미 없다
    const { rerender, onSpeechEnd, initialProps } = renderSpeech();

    rerender({ ...initialProps, playing: false }); // 이탈 — 정리 완료
    await act(async () => ttsMock.state.onError?.()); // 그 뒤에야 도착한 음원 실패

    expect(track).not.toHaveBeenCalled();
    expect(ttsMock.speak).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(speechTypingMs(OPENING) + speechEndPauseMs);
    });
    expect(onSpeechEnd).not.toHaveBeenCalled();
  });

  it('타이머 폴백 중 발화 단계를 벗어나면 종료를 알리지 않는다', async () => {
    const { rerender, onSpeechEnd, initialProps } = renderSpeech({
      voice: null,
    });
    await act(async () => ttsMock.state.onError?.()); // 타이머 폴백 진입

    rerender({ ...initialProps, voice: null, playing: false });
    await act(async () => {
      vi.advanceTimersByTime(speechTypingMs(OPENING) + speechEndPauseMs);
    });

    expect(onSpeechEnd).not.toHaveBeenCalled();
  });

  it('합성 재생이 실패하면 synthesized 출처로 실패 이벤트를 찍고 발화를 마친다', async () => {
    const { onSpeechEnd } = renderSpeech({ openingSrc: null });

    await act(async () => ttsMock.state.onError?.());

    expect(track).toHaveBeenCalledWith('Speech Playback Failed', {
      source: 'synthesized',
    });
    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('다음 질문 프리페치는 음성이 있을 때만 합성을 요청한다', async () => {
    const { result } = renderSpeech();

    act(() => result.current.prefetch({ content: 'Next question' }));

    expect(ttsMock.prefetch).toHaveBeenCalledWith('Next question', voice);
  });

  it('음성이 없으면 프리페치하지 않는다', async () => {
    const { result } = renderSpeech({ voice: null });

    act(() => result.current.prefetch({ content: 'Next question' }));

    expect(ttsMock.prefetch).not.toHaveBeenCalled();
  });
});

// 분리 재생 — 맞장구(ttsText)만 합성하고, 고정 질문은 미리 만든 음원을 이어 튼다
describe('useAiSpeech 분리 재생', () => {
  const FULL = 'Thanks! By the way, what size would you like?';
  const BACKCHANNEL = 'Thanks!';
  const QUESTION = 'By the way, what size would you like?';
  const QUESTION_URL = 'https://cdn.example.com/question-2.mp3';
  const playback = { progress: () => 0, source: 'blob:fake' };

  const renderSplit = (sourceOver: Partial<SpeechSource> = {}) =>
    renderSpeech({
      openingSrc: null,
      source: {
        content: FULL,
        ttsText: BACKCHANNEL,
        questionAudioUrl: QUESTION_URL,
        ...sourceOver,
      },
    });

  it('맞장구와 질문 음원이 함께 오면 맞장구만 합성해 말하고, 끝나면 질문 음원을 이어 튼다', async () => {
    const { onSpeechEnd } = renderSplit();

    expect(ttsMock.speak).toHaveBeenCalledWith(
      BACKCHANNEL,
      voice,
      expect.anything(),
    );
    expect(ttsMock.speakSrc).not.toHaveBeenCalled();

    await act(async () => ttsMock.state.onEnd?.()); // 맞장구 재생 종료 → 질문 음원 시작

    expect(ttsMock.speakSrc).toHaveBeenCalledWith(
      QUESTION_URL,
      expect.anything(),
    );
    expect(onSpeechEnd).not.toHaveBeenCalled(); // 아직 질문이 나는 중

    await act(async () => ttsMock.state.onEnd?.()); // 질문 음원 종료

    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('입모양 텍스트는 지금 나는 소리를 따른다 — 맞장구 구간은 맞장구, 질문 구간은 나머지', async () => {
    const { result } = renderSplit();

    await act(async () => ttsMock.state.onStart?.(playback));
    expect(result.current.speech?.text).toBe(BACKCHANNEL);

    await act(async () => ttsMock.state.onEnd?.());
    await act(async () => ttsMock.state.onStart?.(playback));
    expect(result.current.speech?.text).toBe(QUESTION);
  });

  it('질문 텍스트 필드가 오면 content에서 떼어내는 대신 그 값으로 입모양을 맞춘다', async () => {
    const { result } = renderSplit({ fixedQuestionText: 'What size?' });

    await act(async () => ttsMock.state.onEnd?.()); // 맞장구 종료 → 질문 음원 시작
    await act(async () => ttsMock.state.onStart?.(playback));

    expect(result.current.speech?.text).toBe('What size?');
  });

  it('맞장구 합성이 실패하면 실패를 남기고 질문 음원부터 튼다', async () => {
    const { onSpeechEnd } = renderSplit();

    await act(async () => ttsMock.state.onError?.());

    expect(track).toHaveBeenCalledWith('Speech Playback Failed', {
      source: 'synthesized',
    });
    expect(ttsMock.speakSrc).toHaveBeenCalledWith(
      QUESTION_URL,
      expect.anything(),
    );

    await act(async () => ttsMock.state.onEnd?.());
    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('질문 음원 재생이 실패하면 실패를 남기고 발화를 마친다', async () => {
    const { onSpeechEnd } = renderSplit();

    await act(async () => ttsMock.state.onEnd?.()); // 맞장구 종료 → 질문 음원 재생
    await act(async () => ttsMock.state.onError?.()); // 질문 음원 실패

    expect(track).toHaveBeenCalledWith('Speech Playback Failed', {
      source: 'prerecorded',
    });
    expect(onSpeechEnd).toHaveBeenCalledTimes(1); // 이 발화를 건너뛰고 다음으로
  });

  it('두 값 중 하나라도 없으면 기존대로 content 전체를 합성한다', async () => {
    renderSplit({ questionAudioUrl: null });

    expect(ttsMock.speak).toHaveBeenCalledWith(FULL, voice, expect.anything());
    expect(ttsMock.speakSrc).not.toHaveBeenCalled();
  });

  it('발화 단계를 벗어난 뒤 도착한 맞장구 종료는 질문 재생을 되살리지 않는다', async () => {
    const { rerender, onSpeechEnd, initialProps } = renderSplit();

    rerender({ ...initialProps, playing: false }); // 이탈 — 정리 완료
    await act(async () => ttsMock.state.onEnd?.()); // 그 뒤에야 도착한 맞장구 종료

    expect(ttsMock.speakSrc).not.toHaveBeenCalled();
    expect(onSpeechEnd).not.toHaveBeenCalled();
  });

  it('분리 소스 프리페치는 맞장구만 미리 합성하고 질문 음원을 미리 연다', async () => {
    const { result } = renderSpeech();

    act(() =>
      result.current.prefetch({
        content: FULL,
        ttsText: BACKCHANNEL,
        questionAudioUrl: QUESTION_URL,
      }),
    );

    expect(ttsMock.prefetch).toHaveBeenCalledWith(BACKCHANNEL, voice);
    expect(ttsMock.prefetchSrc).toHaveBeenCalledWith(QUESTION_URL);
  });
});

// 오프닝 음원 미리 열기 — 누르는 순간 받기 시작하지 않게, 켠 호출부(스몰톡 탭 인사)만 재생 전에 열어 둔다
describe('오프닝 음원 미리 열기', () => {
  const OPENING_URL = 'https://cdn.example.com/questions/10.mp3';

  it('켜 두면 재생 차례가 오기 전에 오프닝 음원을 미리 열어 둔다', () => {
    renderSpeech({ playing: false, preloadOpening: true });

    expect(ttsMock.prefetchSrc).toHaveBeenCalledWith(OPENING_URL);
  });

  it('켜지 않으면 미리 열지 않는다 — 대화 오프닝은 들어오자마자 틀거나(상대 선발화) 안 틀어서(내 선발화) 미리 받을 이득이 없다', () => {
    renderSpeech({ playing: false });

    expect(ttsMock.prefetchSrc).not.toHaveBeenCalled();
  });

  it('재생 중에는 미리 열지 않는다 — 지금 트는 음원과 겹친다', () => {
    renderSpeech({ preloadOpening: true });

    expect(ttsMock.prefetchSrc).not.toHaveBeenCalled();
  });

  it('오프닝 음원이 바뀌면 새 음원을 미리 연다', () => {
    const { rerender, initialProps } = renderSpeech({
      playing: false,
      preloadOpening: true,
    });
    clearTtsCalls();

    rerender({ ...initialProps, openingSrc: '/audio/b.mp3' });

    expect(ttsMock.prefetchSrc).toHaveBeenCalledWith('/audio/b.mp3');
  });

  it('재생이 끝나면 같은 음원을 다시 열어 둔다 — 또 눌러도 바로 나온다', async () => {
    const { rerender, initialProps } = renderSpeech({ preloadOpening: true });
    await act(async () => ttsMock.state.onEnd?.());
    clearTtsCalls();

    rerender({ ...initialProps, playing: false });

    expect(ttsMock.prefetchSrc).toHaveBeenCalledWith(OPENING_URL);
  });
});

// 다시 듣기 — 같은 발화를 한 번 더 재생한다. 대화 진행은 건드리지 않는다
describe('useAiSpeech 다시 듣기', () => {
  const LINE = 'What size would you like?';

  // 발화 한 구간을 끝까지 재생하고 유저 차례(playing=false, 다시 듣기 허용)로 넘어간 상태를 만든다
  const renderAfterSpeech = async (
    over: Partial<Parameters<typeof useAiSpeech>[0]> = {},
  ) => {
    const rendered = renderSpeech({
      openingSrc: null,
      source: { content: LINE },
      ...over,
    });
    await act(async () => ttsMock.state.onEnd?.());
    rendered.rerender({
      ...rendered.initialProps,
      playing: false,
      replayAllowed: true,
    });
    clearTtsCalls();
    return rendered;
  };

  it('다시 듣기를 부르면 같은 발화를 처음부터 다시 재생한다', async () => {
    const { result } = await renderAfterSpeech();

    act(() => result.current.replay());

    expect(ttsMock.speak).toHaveBeenCalledWith(LINE, voice, expect.anything());
    expect(result.current.replaying).toBe(true);
  });

  it('다시 듣기가 끝나도 대화를 다음 단계로 넘기지 않는다', async () => {
    // Given 다시 듣기는 턴을 진행시키는 연출이 아니다 — 끝나도 유저 차례 그대로다
    const { result, onSpeechEnd } = await renderAfterSpeech();
    onSpeechEnd.mockClear();

    act(() => result.current.replay());
    await act(async () => ttsMock.state.onEnd?.());

    expect(onSpeechEnd).not.toHaveBeenCalled();
    expect(result.current.replaying).toBe(false);
  });

  it('다시 듣기 중에도 입모양은 지금 나는 소리를 따른다', async () => {
    const { result } = await renderAfterSpeech();

    act(() => result.current.replay());
    await act(async () =>
      ttsMock.state.onStart?.({ progress: () => 0, source: 'blob:fake' }),
    );

    expect(result.current.speech?.text).toBe(LINE);
  });

  it('재생 중에 다시 누르면 멈춘다', async () => {
    const { result } = await renderAfterSpeech();
    act(() => result.current.replay());

    act(() => result.current.replay());

    expect(ttsMock.stop).toHaveBeenCalled();
    expect(result.current.replaying).toBe(false);
    expect(result.current.speech).toBeNull();
  });

  it('허용 구간이 끝나면(내가 말하기 시작) 다시 듣기를 끊는다 — 소리가 STT에 섞이지 않게', async () => {
    const { result, rerender, initialProps } = await renderAfterSpeech();
    act(() => result.current.replay());

    rerender({ ...initialProps, playing: false, replayAllowed: false });

    expect(ttsMock.stop).toHaveBeenCalled();
    expect(result.current.replaying).toBe(false);
    expect(result.current.speech).toBeNull();
  });

  it('상대가 말하는 중(허용 밖)에 부른 다시 듣기는 무시한다 — 소리를 뺏으면 그 발화가 끝을 못 알린다', async () => {
    const { result } = renderSpeech({
      openingSrc: null,
      source: { content: LINE },
    });
    ttsMock.speak.mockClear();

    act(() => result.current.replay());

    expect(ttsMock.speak).not.toHaveBeenCalled();
    expect(result.current.replaying).toBe(false);
  });

  it('다시 듣기는 질문 음원을 미리 연다 — 맞장구 뒤 이어 재생 공백을 없앤다', async () => {
    // Given 분리 재생 발화(맞장구 합성 → 질문 음원) — 첫 구간 종료는 헬퍼가, 둘째 구간은 여기서 흘린다
    const { result } = await renderAfterSpeech({
      source: {
        content: 'Sure! What size?',
        ttsText: 'Sure!',
        questionAudioUrl: 'https://cdn.example.com/q.mp3',
      },
    });
    await act(async () => ttsMock.state.onEnd?.());
    clearTtsCalls();

    act(() => result.current.replay());

    expect(ttsMock.prefetchSrc).toHaveBeenCalledWith(
      'https://cdn.example.com/q.mp3',
    );
  });

  it('다시 듣기 중 다음 발화가 시작되면 새 발화가 이긴다', async () => {
    const { result, rerender, initialProps } = await renderAfterSpeech();
    act(() => result.current.replay());
    ttsMock.speak.mockClear();

    rerender({
      ...initialProps,
      playing: true,
      replayAllowed: false,
      source: { content: 'Anything else?' },
    });

    expect(result.current.replaying).toBe(false);
    expect(ttsMock.speak).toHaveBeenCalledWith(
      'Anything else?',
      voice,
      expect.anything(),
    );
  });

  it('오프닝 구간에서 다시 들으면 첫 질문 음원을 그대로 다시 틀고, 안 쓸 합성은 미리 시키지 않는다', async () => {
    // 아직 markOpeningPlayed 전이라 이 발화의 소리는 여전히 오프닝 음원이다
    const { result } = await renderAfterSpeech({
      openingSrc: 'https://cdn.example.com/questions/10.mp3',
    });

    act(() => result.current.replay());

    expect(ttsMock.speakSrc).toHaveBeenCalledWith(
      'https://cdn.example.com/questions/10.mp3',
      expect.anything(),
    );
    expect(ttsMock.prefetch).not.toHaveBeenCalled();
  });
});

describe('문장 단위 재생', () => {
  const FIRST = 'That sounds like a really fun trip, honestly.';
  const SECOND = 'I have always wanted to go there myself.';
  const THIRD = 'What was the best thing you ate while you were there?';
  const LONG = `${FIRST} ${SECOND} ${THIRD}`;

  beforeEach(() => {
    clearTtsCalls();
  });

  const finishCurrent = () => act(() => ttsMock.state.onEnd?.());

  it('긴 발화는 앞 문장부터 차례로 틀고, 마지막 문장이 끝나야 발화가 끝난다', async () => {
    // Given
    const { onSpeechEnd } = renderSpeech({
      source: { content: LONG },
      openingSrc: null,
    });
    await act(async () => {});
    expect(ttsMock.speak.mock.calls.map(([text]) => text)).toEqual([FIRST]);

    // When
    finishCurrent();
    await act(async () => {});

    // Then
    expect(ttsMock.speak.mock.calls.map(([text]) => text)).toEqual([
      FIRST,
      SECOND,
    ]);
    expect(onSpeechEnd).not.toHaveBeenCalled();

    finishCurrent();
    await act(async () => {});
    finishCurrent();
    await act(async () => {});
    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('한 발화의 합성은 동시에 세 개까지만 건다 — 제공사 동시 요청 한도를 아낀다', async () => {
    // Given 합성이 끝나지 않고 있다
    const FOURTH = 'I would love to try it someday, to be honest.';
    const finishes: (() => void)[] = [];
    ttsMock.prefetch.mockImplementation(
      () => new Promise<void>((resolve) => finishes.push(resolve)),
    );

    // When
    renderSpeech({
      source: { content: `${LONG} ${FOURTH}` },
      openingSrc: null,
    });
    await act(async () => {});

    // Then 네 번째 문장은 앞 합성이 끝나야 시작한다
    expect(ttsMock.prefetch.mock.calls.map(([text]) => text)).toEqual([
      FIRST,
      SECOND,
      THIRD,
    ]);
    await act(async () => finishes[0]());
    expect(ttsMock.prefetch.mock.calls.at(-1)?.[0]).toBe(FOURTH);
    ttsMock.prefetch.mockImplementation(() => Promise.resolve());
  });

  it('재생을 정리하거나 합성을 포기하면 아직 시작 안 한 뒤 문장은 합성하지 않는다 — 안 틀 문장에 비용을 쓰지 않는다', async () => {
    // Given 네 문장 중 앞의 셋이 합성 중이다
    const FOURTH = 'I would love to try it someday, to be honest.';
    const finishes: (() => void)[] = [];
    ttsMock.prefetch.mockImplementation(
      () => new Promise<void>((resolve) => finishes.push(resolve)),
    );
    const { unmount } = renderSpeech({
      source: { content: `${LONG} ${FOURTH}` },
      openingSrc: null,
    });
    await act(async () => {});

    // When 재생을 정리한 뒤 앞 합성이 끝난다
    unmount();
    await act(async () => finishes[0]());

    // Then
    expect(ttsMock.prefetch).toHaveBeenCalledTimes(3);
    ttsMock.prefetch.mockImplementation(() => Promise.resolve());
  });

  it('재생을 시작하면 뒤 문장도 함께 합성해 둔다 — 앞 문장이 끝날 때 기다리지 않게', async () => {
    // Given / When
    renderSpeech({ source: { content: LONG }, openingSrc: null });
    await act(async () => {});

    // Then
    expect(ttsMock.prefetch).toHaveBeenCalledWith(SECOND, voice);
    expect(ttsMock.prefetch).toHaveBeenCalledWith(THIRD, voice);
  });

  it('미리 준비도 문장 단위로 한다 — 재생과 같은 조각이어야 합성을 다시 하지 않는다', async () => {
    // Given
    const { result } = renderSpeech({ source: null, playing: false });

    // When
    await act(async () => result.current.prefetch({ content: LONG }));

    // Then
    expect(ttsMock.prefetch).toHaveBeenCalledTimes(3);
    expect(ttsMock.prefetch).toHaveBeenCalledWith(FIRST, voice);
    expect(ttsMock.prefetch).toHaveBeenCalledWith(SECOND, voice);
    expect(ttsMock.prefetch).toHaveBeenCalledWith(THIRD, voice);
  });

  it('중간 문장 합성이 실패해도 다음 문장으로 넘어간다', async () => {
    // Given
    const { onSpeechEnd } = renderSpeech({
      source: { content: LONG },
      openingSrc: null,
    });
    await act(async () => {});
    finishCurrent();
    await act(async () => {});

    // When
    act(() => ttsMock.state.onError?.());
    await act(async () => {});

    // Then
    expect(ttsMock.speak.mock.calls.at(-1)?.[0]).toBe(THIRD);
    expect(onSpeechEnd).not.toHaveBeenCalled();
  });

  it('합성 응답이 끝내 안 와도 미리 만든 질문 음원은 튼다 — 합성과 무관하게 들을 수 있는 소리다', async () => {
    // Given
    const { onSpeechEnd } = renderSpeech({
      source: {
        content: `${FIRST} ${SECOND} Which one?`,
        ttsText: `${FIRST} ${SECOND}`,
        questionAudioUrl: 'https://cdn.example.com/q.mp3',
      },
      openingSrc: null,
    });
    await act(async () => {});

    // When
    act(() => ttsMock.state.onError?.(new TtsTimeoutError()));
    await act(async () => {});

    // Then
    expect(ttsMock.speak).toHaveBeenCalledTimes(1);
    expect(ttsMock.speakSrc).toHaveBeenCalledWith(
      'https://cdn.example.com/q.mp3',
      expect.anything(),
    );
    expect(onSpeechEnd).not.toHaveBeenCalled();
  });

  it('여러 문장이 실패해도 재생 실패 지표는 발화당 한 번만 남긴다', async () => {
    // Given
    vi.mocked(track).mockClear();
    renderSpeech({ source: { content: LONG }, openingSrc: null });
    await act(async () => {});

    // When
    act(() => ttsMock.state.onError?.());
    await act(async () => {});
    act(() => ttsMock.state.onError?.());
    await act(async () => {});

    // Then
    expect(vi.mocked(track)).toHaveBeenCalledTimes(1);
  });

  it('합성 응답이 끝내 안 오면 남은 문장을 건너뛰고 발화를 끝낸다 — 문장마다 다시 기다리면 대화가 오래 멈춘다', async () => {
    // Given
    const { onSpeechEnd } = renderSpeech({
      source: { content: LONG },
      openingSrc: null,
    });
    await act(async () => {});

    // When
    act(() => ttsMock.state.onError?.(new TtsTimeoutError()));
    await act(async () => {});

    // Then
    expect(ttsMock.speak).toHaveBeenCalledTimes(1);
    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('재생이 정리되면 늦게 끝난 문장이 다음 문장을 틀지 않는다', async () => {
    // Given
    const { unmount } = renderSpeech({
      source: { content: LONG },
      openingSrc: null,
    });
    await act(async () => {});
    const finishFirst = ttsMock.state.onEnd;

    // When
    unmount();
    await act(async () => finishFirst?.());

    // Then
    expect(ttsMock.speak).toHaveBeenCalledTimes(1);
  });

  it('입모양은 지금 나는 문장의 글자를 따른다', async () => {
    // Given
    const { result } = renderSpeech({
      source: { content: LONG },
      openingSrc: null,
    });
    await act(async () => {});
    finishCurrent();
    await act(async () => {});

    // When
    act(() => ttsMock.state.onStart?.({ progress: () => 0, source: 'b' }));

    // Then
    expect(result.current.speech?.text).toBe(SECOND);
  });
});

describe('소리가 시작되기 전 대기', () => {
  beforeEach(() => {
    clearTtsCalls();
  });

  it('합성을 기다리는 동안은 대기 중이고, 소리가 시작되면 끝난다', async () => {
    // Given
    const { result } = renderSpeech({
      source: { content: OPENING },
      openingSrc: null,
    });
    await act(async () => {});
    expect(result.current.waitingForSound).toBe(true);

    // When
    act(() => ttsMock.state.onStart?.({ progress: () => 0, source: 'b' }));

    // Then
    expect(result.current.waitingForSound).toBe(false);
  });

  it('목소리가 없으면 기다릴 소리가 없어 바로 대기가 끝난다', async () => {
    // Given / When
    const { result } = renderSpeech({
      source: { content: OPENING },
      openingSrc: null,
      voice: null,
    });
    await act(async () => {});

    // Then
    expect(result.current.waitingForSound).toBe(false);
  });

  it('재생할 차례가 아니면 대기가 아니다', () => {
    // Given / When
    const { result } = renderSpeech({ playing: false, source: null });

    // Then
    expect(result.current.waitingForSound).toBe(false);
  });

  it('다시 듣기 뒤 상대가 같은 말을 또 해도 소리를 기다린다', async () => {
    // Given 내 차례에 방금 들은 말을 다시 듣고 끝냈다
    const { result, rerender, initialProps } = renderSpeech({
      playing: false,
      source: { content: OPENING },
      openingSrc: null,
      replayAllowed: true,
    });
    act(() => {
      result.current.replay();
    });
    await act(async () => {});
    act(() => ttsMock.state.onStart?.({ progress: () => 0, source: 'b' }));
    act(() => ttsMock.state.onEnd?.());
    await act(async () => {});

    // When 상대가 같은 문장으로 다시 말할 차례가 됐다
    rerender({
      ...initialProps,
      playing: true,
      source: { content: OPENING },
      openingSrc: null,
    });

    // Then
    expect(result.current.waitingForSound).toBe(true);
  });

  it('다음 발화로 넘어가면 그 발화의 소리를 다시 기다린다', async () => {
    // Given
    const { result, rerender, initialProps } = renderSpeech({
      source: { content: OPENING },
      openingSrc: null,
    });
    await act(async () => {});
    act(() => ttsMock.state.onStart?.({ progress: () => 0, source: 'b' }));

    // When
    rerender({ ...initialProps, source: { content: 'Next line please.' } });

    // Then — 다음 발화의 글자가 소리보다 먼저 나오면 안 된다
    expect(result.current.waitingForSound).toBe(true);
  });
});

// 재생 위치가 오래 그대로면 재생 모듈이 멈춤을 알린다 — 실기기(iOS 27 웹뷰)에서 4초짜리 첫 질문 음원이 25초 동안 끝나지 않아
// 마이크가 켜지지 않았다. 멈추면 턴은 넘기되 소리는 끄지 않는다 — 다시 나오면 끝까지 들리고, 마이크를 켜면 그때 끈다
describe('재생이 멈췄을 때', () => {
  const snapshot = {
    started: false,
    positionMs: 0,
    readyState: 1,
    networkState: 2,
    paused: false,
    lastMediaEvent: 'stalled',
    backgrounded: true,
  };
  const stall = () => act(async () => ttsMock.state.onStall?.(snapshot));
  // 대화처럼 턴이 있는 재생 — 멈추면 턴을 넘기도록 켠다
  const renderTurn = (over: Partial<Parameters<typeof useAiSpeech>[0]> = {}) =>
    renderSpeech({ passTurnOnStall: true, ...over });

  // 오프닝 음원이 멈춰 턴을 넘기고, 유저 차례(playing=false, 다시 듣기 허용)로 넘어간 상태를 만든다
  const renderTurnPassed = async (
    over: Partial<Parameters<typeof useAiSpeech>[0]> = {},
  ) => {
    const rendered = renderTurn(over);
    await stall();
    rendered.rerender({
      ...rendered.initialProps,
      playing: false,
      replayAllowed: true,
    });
    return rendered;
  };

  it('기본값은 멈춰도 턴을 넘기지 않는다 — 인사처럼 턴이 없는 재생은 소리를 끊어 줄 계기가 없다', async () => {
    // Given
    const { onSpeechEnd } = renderSpeech();

    // Then
    expect(ttsMock.state.onStall).toBeUndefined();
    expect(onSpeechEnd).not.toHaveBeenCalled();
  });

  it('멈춰 턴을 넘긴 순간 내가 말하기 시작했으면 남은 소리를 끊는다 — 끊기와 멈춤이 겹쳐도 녹음에 섞이지 않게', async () => {
    // Given: 멈춰서 턴을 넘겼지만, 그 사이 내가 끊고 말하기 시작해 다시 듣기 허용 구간을 거치지 않았다
    const { rerender, initialProps } = renderTurn({ replayAllowed: false });
    await stall();
    ttsMock.stop.mockClear();

    // When: 발화 단계를 벗어나 곧장 내 녹음으로 간다
    rerender({ ...initialProps, playing: false, replayAllowed: false });

    // Then: 남겨 둘 이유가 없는 소리는 끊긴다
    expect(ttsMock.stop).toHaveBeenCalled();
  });

  it('멈추면 발화를 끝내 내 차례로 넘긴다', async () => {
    // Given
    const { onSpeechEnd } = renderTurn();

    // When
    await stall();

    // Then
    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('턴을 넘기면 입모양을 멈춘다 — 멈춘 재생 위치에서 입이 벌린 채 굳지 않게', async () => {
    // Given — 재생이 시작돼 입이 움직이던 중이다
    const { result } = renderTurn();
    await act(async () =>
      ttsMock.state.onStart?.({ progress: () => 0.3, source: 'q.mp3' }),
    );
    expect(result.current.speech).not.toBeNull();

    // When
    await stall();

    // Then
    expect(result.current.speech).toBeNull();
  });

  it('멈춘 순간의 오디오 상태를 계측으로 남긴다 — 왜 멈췄는지 좁히는 단서다', async () => {
    // Given
    renderTurn({ sessionId: 7 });
    vi.mocked(track).mockClear();

    // When
    await stall();

    // Then
    expect(track).toHaveBeenCalledWith(EVENTS.SPEECH_PLAYBACK_STALLED, {
      session_id: 7,
      source: 'prerecorded',
      started: false,
      position_ms: 0,
      ready_state: 1,
      network_state: 2,
      paused: false,
      last_media_event: 'stalled',
      backgrounded: true,
    });
  });

  it('턴을 넘겨도 소리는 끄지 않는다 — 다시 나오면 끝까지 들린다', async () => {
    // Given
    const rendered = renderTurn();
    await stall();
    clearTtsCalls();

    // When — 내 차례로 넘어간다
    rendered.rerender({
      ...rendered.initialProps,
      playing: false,
      replayAllowed: true,
    });

    // Then
    expect(ttsMock.stop).not.toHaveBeenCalled();
  });

  it('넘긴 뒤 소리가 끝까지 나도 종료를 다시 알리지 않는다', async () => {
    // Given
    const { onSpeechEnd, result } = await renderTurnPassed();
    await act(async () =>
      ttsMock.state.onStart?.({ progress: () => 0.5, source: 'q.mp3' }),
    );
    expect(result.current.speech).not.toBeNull();

    // When
    await act(async () => ttsMock.state.onEnd?.());

    // Then — 턴은 이미 넘어갔고, 입은 소리와 함께 멈춘다
    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
    expect(result.current.speech).toBeNull();
  });

  it('넘긴 뒤 마이크를 켜면(다시 듣기 허용이 끝나면) 남은 소리를 끈다 — 내 녹음에 섞이지 않게', async () => {
    // Given
    const rendered = await renderTurnPassed();
    clearTtsCalls();

    // When
    rendered.rerender({
      ...rendered.initialProps,
      playing: false,
      replayAllowed: false,
    });

    // Then
    expect(ttsMock.stop).toHaveBeenCalled();
  });

  it('넘긴 뒤 화면을 떠나면 남은 소리를 끈다', async () => {
    // Given
    const rendered = await renderTurnPassed();
    clearTtsCalls();

    // When
    rendered.unmount();

    // Then
    expect(ttsMock.stop).toHaveBeenCalled();
  });

  it('넘긴 뒤 다시 듣기를 누르면 남은 소리를 끊고 처음부터 다시 튼다', async () => {
    // Given
    const { result } = await renderTurnPassed();
    clearTtsCalls();

    // When
    act(() => {
      result.current.replay();
    });

    // Then
    expect(ttsMock.stop).toHaveBeenCalled();
    expect(ttsMock.speakSrc).toHaveBeenCalledTimes(1);
    expect(result.current.replaying).toBe(true);
  });

  it('넘긴 뒤 오프닝 음원이 실패해도 합성으로 다시 틀지 않는다 — 이미 내 차례다', async () => {
    // Given
    await renderTurnPassed();
    clearTtsCalls();

    // When
    await act(async () => ttsMock.state.onError?.());

    // Then
    expect(ttsMock.speak).not.toHaveBeenCalled();
  });

  it('맞장구 합성이 멈춰도 턴을 넘기고, 소리가 이어지면 질문 음원까지 튼다', async () => {
    // Given
    const { onSpeechEnd } = renderTurn({
      openingSrc: null,
      source: {
        content: 'Nice! What size?',
        ttsText: 'Nice!',
        fixedQuestionText: 'What size?',
        questionAudioUrl: 'https://cdn.example.com/q.mp3',
      },
    });

    // When
    await stall();
    await act(async () => ttsMock.state.onEnd?.());

    // Then
    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
    expect(ttsMock.speakSrc).toHaveBeenCalledWith(
      'https://cdn.example.com/q.mp3',
      expect.anything(),
    );
  });

  it('다시 듣기는 멈춰도 턴과 무관하다 — 멈춤 감시를 걸지 않는다', async () => {
    // Given — 오프닝이 끝나 내 차례다
    const rendered = renderTurn();
    await act(async () => ttsMock.state.onEnd?.());
    rendered.rerender({
      ...rendered.initialProps,
      playing: false,
      replayAllowed: true,
    });

    // When
    act(() => {
      rendered.result.current.replay();
    });

    // Then
    expect(ttsMock.state.onStall).toBeUndefined();
  });

  it('턴을 넘긴 뒤 소리가 다시 나오면 멈춰 있던 시간을 한 번만 기록한다 — 멈춤 기준을 조정하는 근거다', async () => {
    // Given
    await renderTurnPassed({ sessionId: 7 });
    vi.mocked(track).mockClear();

    // When — 다시 나왔다가 또 멈추고 다시 나온다
    await act(async () => ttsMock.state.onResume?.({ stalledMs: 4_500 }));
    await stall();
    await act(async () => ttsMock.state.onResume?.({ stalledMs: 3_500 }));

    // Then
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(EVENTS.SPEECH_PLAYBACK_RESUMED, {
      session_id: 7,
      source: 'prerecorded',
      stalled_ms: 4_500,
    });
  });

  it('멈췄던 소리가 다시 나오면 입모양도 다시 소리를 따른다', async () => {
    // Given — 입이 움직이다 멈춰 턴을 넘겼다
    const { result } = renderTurn();
    const playback = { progress: () => 0.3, source: 'q.mp3' };
    await act(async () => ttsMock.state.onStart?.(playback));
    await stall();
    expect(result.current.speech).toBeNull();

    // When
    await act(async () => ttsMock.state.onResume?.({ stalledMs: 4_500 }));

    // Then
    expect(result.current.speech).toEqual({ playback, text: OPENING });
  });

  it('턴을 넘긴 뒤 소리가 다시 나오면 다시 듣기가 재생 중으로 보이고, 누르면 그 소리를 멈춘다', async () => {
    // Given
    const { result } = await renderTurnPassed();
    await act(async () =>
      ttsMock.state.onStart?.({ progress: () => 0.3, source: 'q.mp3' }),
    );
    await act(async () => ttsMock.state.onResume?.({ stalledMs: 4_500 }));
    expect(result.current.replaying).toBe(true);
    clearTtsCalls();

    // When
    let started = true;
    act(() => {
      started = result.current.replay();
    });

    // Then — 다시 틀지 않고 멈춘다(다시 듣기 계측도 남지 않는다)
    expect(started).toBe(false);
    expect(ttsMock.stop).toHaveBeenCalled();
    expect(ttsMock.speakSrc).not.toHaveBeenCalled();
    expect(result.current.replaying).toBe(false);
    expect(result.current.speech).toBeNull();
  });

  it('턴을 넘긴 뒤 소리가 멈춰 있으면 다시 듣기는 재생 중이 아니다', async () => {
    const { result } = await renderTurnPassed();

    expect(result.current.replaying).toBe(false);
  });

  it('남은 소리가 다시 멈추면 다시 듣기도 재생 중이 아니다', async () => {
    // Given
    const { result } = await renderTurnPassed();
    await act(async () => ttsMock.state.onResume?.({ stalledMs: 4_500 }));
    expect(result.current.replaying).toBe(true);

    // When
    await stall();

    // Then
    expect(result.current.replaying).toBe(false);
  });

  it('남은 소리가 끝나면 다시 듣기도 꺼지고, 그 뒤 마이크를 켜도 다른 소리를 끄지 않는다', async () => {
    // Given
    const rendered = await renderTurnPassed();
    await act(async () => ttsMock.state.onResume?.({ stalledMs: 4_500 }));
    await act(async () => ttsMock.state.onEnd?.());
    expect(rendered.result.current.replaying).toBe(false);
    clearTtsCalls();

    // When
    rendered.rerender({
      ...rendered.initialProps,
      playing: false,
      replayAllowed: false,
    });

    // Then — 끝난 회차의 중단 손잡이가 남아 있으면 엉뚱한 소리를 끈다
    expect(ttsMock.stop).not.toHaveBeenCalled();
  });

  it('발화 단계를 벗어난 뒤 도착한 멈춤은 턴을 넘기지도, 계측하지도 않는다', async () => {
    // Given
    const rendered = renderTurn();
    const lateStall = ttsMock.state.onStall;
    rendered.rerender({ ...rendered.initialProps, playing: false });
    vi.mocked(track).mockClear();

    // When
    await act(async () => lateStall?.(snapshot));

    // Then
    expect(rendered.onSpeechEnd).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });
});
