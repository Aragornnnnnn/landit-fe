// AI 발화 재생 훅 검증 — 오프닝 음원·합성 폴백·타이머 폴백과 다음 질문 프리페치
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';
import { setSpeechRate } from '@/shared/lib/speech-rate';
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
    onError: undefined as (() => void) | undefined,
  };
  interface CapturedOptions {
    onStart?: (playback: FakePlayback) => void;
    onEnd?: () => void;
    onError?: () => void;
  }
  const capture = (opts?: CapturedOptions) => {
    state.onStart = opts?.onStart;
    state.onEnd = opts?.onEnd;
    state.onError = opts?.onError;
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
    prefetch: vi.fn(() => Promise.resolve()),
    prefetchSrc: vi.fn(),
    stop: vi.fn(),
  };
});
vi.mock('@/shared/tts/useTts', () => ({
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
      source: 'question_audio',
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

  it('합성 재생이 실패하면 synth 출처로 실패 이벤트를 찍고 발화를 마친다', async () => {
    const { onSpeechEnd } = renderSpeech({ openingSrc: null });

    await act(async () => ttsMock.state.onError?.());

    expect(track).toHaveBeenCalledWith('Speech Playback Failed', {
      source: 'synth',
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
      source: 'synth',
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
      source: 'question_audio',
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
