'use client';

// OpenRouter 프록시(/api/tts)로 텍스트를 합성해 재생하는 TTS 훅 — STT 훅과 콜백·상태 컨벤션을 공유한다
import { useEffect, useRef, useState } from 'react';

import type { TtsVoice } from '@/shared/lib/tts/tts.types';

export type TtsStatus = 'idle' | 'loading' | 'active' | 'error';

interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export function useTts() {
  const [status, setStatus] = useState<TtsStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const onEndRef = useRef<(() => void) | undefined>(undefined);

  // 재생 리소스(오디오·objectURL·콜백)를 정리한다. stop과 onended가 공유하는 뒷정리
  const cleanup = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    onEndRef.current = undefined;
  };

  // 언마운트 시 진행 중인 요청·재생을 정리한다 (라우트 이동 뒤에도 음성이 계속 나오는 것 방지).
  // 컴포넌트가 사라진 뒤라 상태는 건드리지 않고 refs만 정리한다
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const speak = async (
    text: string,
    voice: TtsVoice | null,
    options?: SpeakOptions,
  ) => {
    // 백엔드가 음성 미설정·비활성이면 null을 주므로 조용히 건너뛴다
    if (!voice) return;

    stop();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: text,
          model: voice.model,
          voice: voice.providerVoiceId,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`TTS 합성에 실패했어요. (${response.status})`);
      }

      const url = URL.createObjectURL(await response.blob());
      // 합성 도중 다른 speak/stop으로 밀려났으면 방금 만든 URL만 정리하고 조용히 빠진다
      if (abortRef.current !== controller) {
        URL.revokeObjectURL(url);
        return;
      }
      urlRef.current = url;
      onEndRef.current = options?.onEnd;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        cleanup();
        setStatus('idle');
        options?.onEnd?.();
      };
      audio.onerror = () => {
        cleanup();
        setStatus('error');
        options?.onError?.(new Error('오디오 재생에 실패했어요.'));
      };

      await audio.play();
      setStatus('active');
      options?.onStart?.();
    } catch (error) {
      // stop()으로 중단된 경우는 에러가 아니다.
      // 뒤이은 speak가 이미 새 요청을 걸었으면(abortRef가 다른 컨트롤러) 상태는 그 요청이 소유하므로 건드리지 않는다
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (abortRef.current === null) setStatus('idle');
        return;
      }
      setStatus('error');
      options?.onError?.(
        error instanceof Error ? error : new Error('TTS 합성에 실패했어요.'),
      );
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    const wasPlaying = audioRef.current !== null;
    const onEnd = onEndRef.current;
    cleanup();
    if (wasPlaying) {
      setStatus('idle');
      onEnd?.();
    }
  };

  return { speak, stop, status };
}
