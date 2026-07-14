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

// 합성 요청을 한 곳에서 만든다 — 재생(speak)과 미리 담기(prefetch)가 공유한다.
// 성공 시 오디오 Blob을, 실패 시 예외를 던진다. objectURL은 재생 직전에 새로 만든다
// (iOS WebView는 미리 만들어 묵힌 blob URL 재생이 불안정해서다).
async function synthesizeSpeech(
  text: string,
  voice: TtsVoice,
  signal?: AbortSignal,
): Promise<Blob> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: text,
      model: voice.model,
      voice: voice.providerVoiceId,
    }),
    signal,
  });
  if (!response.ok) {
    throw new Error(`TTS 합성에 실패했어요. (${response.status})`);
  }
  return response.blob();
}

export function useTts() {
  const [status, setStatus] = useState<TtsStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const onEndRef = useRef<(() => void) | undefined>(undefined);

  // 미리 합성해둔 오디오 캐시(text→Blob) — 재생 시 네트워크 왕복 없이 바로 튼다
  const cacheRef = useRef<Map<string, Blob>>(new Map());
  // prefetch 진행 중인 합성(text→Promise) — speak가 겹치면 새로 합성하지 말고 이 Promise를 기다린다
  const inflightRef = useRef<Map<string, Promise<Blob>>>(new Map());
  const mountedRef = useRef(true);

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
    // 캐시 Map은 재할당되지 않으므로 진입 시 지역변수로 잡아 cleanup에서 그대로 정리한다
    const cache = cacheRef.current;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      cache.clear(); // 캐시엔 Blob만 담으므로 정리할 objectURL이 없다
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
      // 재생할 오디오를 확보한다. 우선순위:
      //   1) prefetch가 이미 끝나 캐시에 있으면 그대로 (네트워크 없음)
      //   2) prefetch가 아직 합성 중이면 그 Promise를 재사용 — 새로 합성하면 이미 진행한
      //      시간을 버려 2번째+ 발화가 매번 느려진다 (디바이스는 합성이 길어 특히 심함)
      //   3) 둘 다 없으면 새로 합성
      let blob = cacheRef.current.get(text);
      if (blob) {
        cacheRef.current.delete(text);
      } else {
        // 진행 중인 prefetch가 있으면 재사용하고, 그 합성이 실패했을 때만 새로 합성한다.
        // (prefetch가 없으면 곧장 새로 합성 — 이 경우 stop() abort가 그대로 전파돼야 한다)
        const pending = inflightRef.current.get(text);
        blob = pending
          ? await pending.catch(() =>
              synthesizeSpeech(text, voice, controller.signal),
            )
          : await synthesizeSpeech(text, voice, controller.signal);
        cacheRef.current.delete(text); // prefetch가 캐시에 넣어뒀을 수 있으니 정리
      }
      // 합성 도중 다른 speak/stop으로 밀려났으면 조용히 빠진다 (아직 URL을 안 만들었다)
      if (abortRef.current !== controller) return;

      // URL은 재생 직전에 새로 만든다 — 묵힌 blob URL 재생 불안정(iOS) 회피
      const url = URL.createObjectURL(blob);
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

  // 미리 만들어둔 정적 오디오(예: /audio/opening-{id}.mp3)를 URL로 바로 재생한다 — 합성 없음.
  // 파일이 없으면(404 등) onError로 알려, 호출부가 런타임 합성으로 폴백할 수 있게 한다.
  const speakSrc = (src: string, options?: SpeakOptions) => {
    stop();
    setStatus('loading');
    onEndRef.current = options?.onEnd;

    const audio = new Audio(src);
    audioRef.current = audio;
    let handled = false; // onended·onerror·play().catch 중복 처리 방지

    audio.onended = () => {
      if (handled) return;
      handled = true;
      cleanup();
      setStatus('idle');
      options?.onEnd?.();
    };
    const fail = () => {
      if (handled) return;
      handled = true;
      cleanup();
      setStatus('error');
      options?.onError?.(new Error('오디오 재생에 실패했어요.'));
    };
    audio.onerror = fail;
    audio.play().then(
      () => {
        if (!handled) {
          setStatus('active');
          options?.onStart?.();
        }
      },
      (error) => {
        // stop()으로 pause되어 play가 거부된 경우(AbortError)는 실패가 아니다 —
        // 합성 폴백을 부르지 않는다. (StrictMode 재실행·전환에서 발생)
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        fail();
      },
    );
  };

  // 미리 합성해 캐시에 담아둔다 — 다음 speak를 즉시 재생시켜 재생 지연을 없앤다.
  // 재생 중인 요청과 독립적으로 동작하고, 실패는 조용히 무시한다(speak가 다시 시도한다).
  const prefetch = async (text: string, voice: TtsVoice | null) => {
    if (!voice || !text) return;
    if (cacheRef.current.has(text) || inflightRef.current.has(text)) return;
    // 합성 Promise를 inflight에 등록해 둔다 — 완료 전에 speak가 겹치면 이 Promise를 그대로 재사용한다
    const pending = synthesizeSpeech(text, voice)
      .then((blob) => {
        // 언마운트된 뒤 도착한 응답은 캐시에 담지 않는다 (Blob이라 정리할 것 없음)
        if (mountedRef.current) cacheRef.current.set(text, blob);
        return blob;
      })
      .finally(() => {
        inflightRef.current.delete(text);
      });
    inflightRef.current.set(text, pending);
    // 프리페치 자체 실패는 조용히 무시한다(speak가 다시 합성한다)
    await pending.catch(() => {});
  };

  // 중단은 '재생 완료'가 아니다 — onEnd는 오디오가 실제로 끝났을 때(onended)만 부른다.
  // (effect 정리·언마운트·StrictMode 재실행에서 stop이 불려도 대화가 advance되면 안 된다)
  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    cleanup(); // onEndRef도 지워 다시 불리지 않게 한다
    setStatus('idle');
  };

  return { speak, speakSrc, prefetch, stop, status };
}
