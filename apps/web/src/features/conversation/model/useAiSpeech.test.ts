// AI 발화 재생 훅 검증 — 오프닝 정적 mp3·합성 폴백·타이머 폴백과 다음 질문 프리페치
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';
import type { TtsVoice } from '@/shared/tts/voice';

import { speechEndPauseMs, speechTypingMs } from './pacing';
import { useAiSpeech } from './useAiSpeech';

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

// TTS는 경계(재생)라 목으로 둔다 — speak/speakSrc의 onEnd·onError를 붙잡아 종료·실패를 흉내 낸다
const ttsMock = vi.hoisted(() => {
  const state = {
    onEnd: undefined as (() => void) | undefined,
    onError: undefined as (() => void) | undefined,
  };
  return {
    state,
    speak: vi.fn(
      (
        _text: string,
        _voice: unknown,
        opts?: { onEnd?: () => void; onError?: () => void },
      ) => {
        state.onEnd = opts?.onEnd;
        state.onError = opts?.onError;
        return Promise.resolve();
      },
    ),
    speakSrc: vi.fn(
      (_src: string, opts?: { onEnd?: () => void; onError?: () => void }) => {
        state.onEnd = opts?.onEnd;
        state.onError = opts?.onError;
      },
    ),
    prefetch: vi.fn(() => Promise.resolve()),
    stop: vi.fn(),
  };
});
vi.mock('@/shared/tts/useTts', () => ({
  useTts: () => ({
    speak: ttsMock.speak,
    speakSrc: ttsMock.speakSrc,
    prefetch: ttsMock.prefetch,
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
    content: OPENING,
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
  ttsMock.state.onEnd = undefined;
  ttsMock.state.onError = undefined;
  ttsMock.speak.mockClear();
  ttsMock.speakSrc.mockClear();
  ttsMock.prefetch.mockClear();
  ttsMock.stop.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useAiSpeech', () => {
  it('오프닝은 미리 만든 정적 mp3로 재생하고, 끝나면 종료를 알린다', () => {
    const { onSpeechEnd } = renderSpeech();

    expect(ttsMock.speakSrc).toHaveBeenCalledWith(
      '/audio/opening-10.mp3',
      expect.anything(),
    );
    expect(ttsMock.speak).not.toHaveBeenCalled();

    act(() => ttsMock.state.onEnd?.());

    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('오프닝 소스가 없으면 정적 재생 없이 바로 합성으로 말한다', () => {
    // 미리 녹음된 오프닝이 없는 대화(예: 스몰톡)는 처음부터 일반 재생 경로를 탄다
    const { onSpeechEnd } = renderSpeech({ openingSrc: null });

    expect(ttsMock.speakSrc).not.toHaveBeenCalled();
    expect(ttsMock.speak).toHaveBeenCalledWith(
      OPENING,
      voice,
      expect.anything(),
    );

    act(() => ttsMock.state.onEnd?.());
    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('오프닝 정적 파일이 없으면 실패를 남기고 합성으로 폴백한다', () => {
    const { onSpeechEnd } = renderSpeech();

    act(() => ttsMock.state.onError?.()); // 정적 파일 없음(404)

    expect(track).toHaveBeenCalledWith('Speech Playback Failed', {
      source: 'opening_mp3',
    });
    expect(ttsMock.speak).toHaveBeenCalledWith(
      OPENING,
      voice,
      expect.anything(),
    );

    act(() => ttsMock.state.onEnd?.());

    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('정적 파일도 음성도 없으면 글자 수 타이머로 발화를 마친다', () => {
    const { onSpeechEnd } = renderSpeech({ voice: null });

    act(() => ttsMock.state.onError?.()); // 정적 파일 없음

    expect(ttsMock.speak).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(speechTypingMs(OPENING) + speechEndPauseMs);
    });

    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('markDynamic 이후의 발화는 정적 mp3가 아니라 합성으로 재생한다', () => {
    const { result, rerender, onSpeechEnd, initialProps } = renderSpeech();
    act(() => ttsMock.state.onEnd?.()); // 오프닝 재생 종료

    act(() => result.current.markDynamic());
    rerender({ ...initialProps, content: 'What size would you like?' });

    expect(ttsMock.speak).toHaveBeenCalledWith(
      'What size would you like?',
      voice,
      expect.anything(),
    );
    expect(ttsMock.speakSrc).toHaveBeenCalledTimes(1); // 정적 재생은 오프닝 한 번뿐

    act(() => ttsMock.state.onEnd?.());
    expect(onSpeechEnd).toHaveBeenCalledTimes(2);
  });

  it('재생 중 발화 단계를 벗어나면 재생을 멈춘다', () => {
    const { rerender, initialProps } = renderSpeech();

    rerender({ ...initialProps, playing: false });

    expect(ttsMock.stop).toHaveBeenCalled();
  });

  it('발화 단계를 벗어난 뒤 도착한 오프닝 실패는 실패로 세지도, 재생을 되살리지도 않는다', () => {
    // 정리(cleanup)가 끝난 뒤 mp3 실패가 뒤늦게 도착하면, 폴백을 시작할 주체가 이미 없다
    const { rerender, onSpeechEnd, initialProps } = renderSpeech();

    rerender({ ...initialProps, playing: false }); // 이탈 — 정리 완료
    act(() => ttsMock.state.onError?.()); // 그 뒤에야 도착한 정적 파일 실패

    expect(track).not.toHaveBeenCalled();
    expect(ttsMock.speak).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(speechTypingMs(OPENING) + speechEndPauseMs);
    });
    expect(onSpeechEnd).not.toHaveBeenCalled();
  });

  it('타이머 폴백 중 발화 단계를 벗어나면 종료를 알리지 않는다', () => {
    const { rerender, onSpeechEnd, initialProps } = renderSpeech({
      voice: null,
    });
    act(() => ttsMock.state.onError?.()); // 타이머 폴백 진입

    rerender({ ...initialProps, voice: null, playing: false });
    act(() => {
      vi.advanceTimersByTime(speechTypingMs(OPENING) + speechEndPauseMs);
    });

    expect(onSpeechEnd).not.toHaveBeenCalled();
  });

  it('합성 재생이 실패하면 synth 출처로 실패 이벤트를 찍고 발화를 마친다', () => {
    const { onSpeechEnd } = renderSpeech({ openingSrc: null });

    act(() => ttsMock.state.onError?.());

    expect(track).toHaveBeenCalledWith('Speech Playback Failed', {
      source: 'synth',
    });
    expect(onSpeechEnd).toHaveBeenCalledTimes(1);
  });

  it('다음 질문 프리페치는 음성이 있을 때만 합성을 요청한다', () => {
    const { result } = renderSpeech();

    act(() => result.current.prefetch('Next question'));

    expect(ttsMock.prefetch).toHaveBeenCalledWith('Next question', voice);
  });

  it('음성이 없으면 프리페치하지 않는다', () => {
    const { result } = renderSpeech({ voice: null });

    act(() => result.current.prefetch('Next question'));

    expect(ttsMock.prefetch).not.toHaveBeenCalled();
  });
});
