// AI 발화 재생 훅 검증 — 오프닝 정적 mp3·합성 폴백·타이머 폴백과 다음 질문 프리페치
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';
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
    openingSrc: '/audio/opening-10.mp3' as string | null,
    onSpeechEnd,
    ...over,
  };
  const hook = renderHook((props) => useAiSpeech(props), { initialProps });
  return { ...hook, onSpeechEnd, initialProps };
};

beforeEach(() => {
  vi.useFakeTimers();
  ttsMock.state.onStart = undefined;
  ttsMock.state.onEnd = undefined;
  ttsMock.state.onError = undefined;
  ttsMock.speak.mockClear();
  ttsMock.speakSrc.mockClear();
  ttsMock.prefetch.mockClear();
  ttsMock.prefetchSrc.mockClear();
  ttsMock.stop.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useAiSpeech', () => {
  it('오프닝은 미리 만든 정적 mp3로 재생하고, 끝나면 종료를 알린다', async () => {
    const { onSpeechEnd } = renderSpeech();

    expect(ttsMock.speakSrc).toHaveBeenCalledWith(
      '/audio/opening-10.mp3',
      expect.anything(),
    );
    expect(ttsMock.speak).not.toHaveBeenCalled();

    await act(async () => ttsMock.state.onEnd?.());

    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('오프닝 소스가 없으면 정적 재생 없이 바로 합성으로 말한다', async () => {
    // 미리 녹음된 오프닝이 없는 대화(예: 스몰톡)는 처음부터 일반 재생 경로를 탄다
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

  it('오프닝 정적 파일이 없으면 실패를 남기고 합성으로 폴백한다', async () => {
    const { onSpeechEnd } = renderSpeech();

    await act(async () => ttsMock.state.onError?.()); // 정적 파일 없음(404)

    expect(track).toHaveBeenCalledWith('Speech Playback Failed', {
      source: 'opening_mp3',
    });
    expect(ttsMock.speak).toHaveBeenCalledWith(
      OPENING,
      voice,
      expect.anything(),
    );

    await act(async () => ttsMock.state.onEnd?.());

    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('정적 파일도 음성도 없으면 글자 수 타이머로 발화를 마친다', async () => {
    const { onSpeechEnd } = renderSpeech({ voice: null });

    await act(async () => ttsMock.state.onError?.()); // 정적 파일 없음

    expect(ttsMock.speak).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(speechTypingMs(OPENING) + speechEndPauseMs);
    });

    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('markOpeningPlayed 이후의 발화는 정적 mp3가 아니라 합성으로 재생한다', async () => {
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
    expect(ttsMock.speakSrc).toHaveBeenCalledTimes(1); // 정적 재생은 오프닝 한 번뿐

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
    await act(async () => ttsMock.state.onError?.()); // 그 뒤에야 도착한 정적 파일 실패

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
