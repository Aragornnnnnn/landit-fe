'use client';

// OpenRouter 프록시(/api/tts)로 텍스트를 합성해 재생하는 TTS 훅 — STT 훅과 콜백·상태 컨벤션을 공유한다
import { useEffect, useRef, useState } from 'react';

import { getSpeechRate } from '@/shared/lib/speech-rate';
import { reportWarning } from '@/shared/monitoring/report';
import type { TtsVoice } from '@/shared/tts/voice';

export type TtsStatus = 'idle' | 'loading' | 'active' | 'error';

/**
 * 재생 중인 음성을 밖에서 따라 읽는 통로 — 립싱크가 쓴다.
 * 오디오 엘리먼트를 그대로 내주면 밖에서 pause·src 교체가 가능해져, 이 훅이 쥔 재생 소유권이 깨진다.
 * progress는 0~1이고 duration을 아직 모르면 0, source는 파형을 읽을 원본 주소다.
 */
export interface TtsPlayback {
  progress: () => number;
  source: string;
}

/** 재생이 멈춘 순간의 오디오 상태 — 왜 멈췄는지(받다 멈춤·재생 중 정지·일시정지) 좁히는 단서다 */
export interface TtsStallSnapshot {
  // 재생 위치가 한 번이라도 움직였나 — 시작을 못 한 것과 도중에 멈춘 것을 가른다
  started: boolean;
  positionMs: number;
  readyState: number;
  networkState: number;
  paused: boolean;
  // 멈추기 전 엘리먼트가 마지막으로 낸 미디어 이벤트
  lastMediaEvent: string | null;
}

/** 재생 멈춤 감시를 신청하는 콜백 — 알리기만 하고 재생은 그대로 둔다 */
interface StallCallbacks {
  // 재생 위치가 오래 그대로가 됐다 — 다시 움직였다가 또 멈추면 또 부른다
  onStall: (snapshot: TtsStallSnapshot) => void;
  // 멈췄던 재생 위치가 다시 움직였다
  onResume?: () => void;
}

/** onStart는 재생이 실제로 시작된 뒤에만 부른다 — 그 전에는 읽을 시각이 없다. onStall을 주면 멈춤 감시가 붙는다 */
interface SpeakOptions extends Partial<StallCallbacks> {
  onStart?: (playback: TtsPlayback) => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

// 재생할 데이터가 있는 상태(HTMLMediaElement.HAVE_CURRENT_DATA) — 이보다 낮으면 아직 받는 중이다
const HAVE_CURRENT_DATA = 2;
// 데이터가 있는데 재생 위치가 이만큼 그대로면 멈춘 것으로 본다 — 재생 중엔 위치가 계속 나아간다
const STALL_MS = 3_000;
// 받는 중엔 더 기다린다 — 질문 음원은 70KB 이하라 100kbps 망에서도 6초 안에 내려온다
const STALL_LOADING_MS = 8_000;
const STALL_CHECK_MS = 500;
// 멈춘 이유를 좁히려고 마지막 신호만 기억해 두는 미디어 이벤트
const STALL_MEDIA_EVENTS = [
  'loadstart',
  'loadedmetadata',
  'canplay',
  'playing',
  'waiting',
  'stalled',
  'suspend',
  'pause',
  'emptied',
] as const;

/**
 * 재생 위치를 지켜보며 멈추면 onStall, 다시 움직이면 onResume을 부르고, 감시를 끝내는 함수를 돌려준다. 소리는 건드리지 않는다.
 * 화면이 숨겨진 동안은 세지 않고 돌아오면 처음부터 센다 — 앱을 내리면 iOS가 재생을 멈추는데 그건 멈춤이 아니다
 */
const watchStall = (
  audio: HTMLAudioElement,
  { onStall, onResume }: StallCallbacks,
): (() => void) => {
  let lastPosition = audio.currentTime;
  let stillMs = 0;
  let started = false;
  let stalled = false;
  let hadData = audio.readyState >= HAVE_CURRENT_DATA;
  let lastMediaEvent: string | null = null;

  const rememberEvent = (event: Event) => {
    lastMediaEvent = event.type;
  };
  const restartCount = () => {
    lastPosition = audio.currentTime;
    stillMs = 0;
  };
  const check = () => {
    if (document.visibilityState === 'hidden') return;
    if (audio.currentTime !== lastPosition) {
      started = true;
      restartCount();
      if (stalled) {
        stalled = false;
        onResume?.();
      }
      return;
    }
    if (stalled) return;
    // 데이터가 막 도착했으면 받던 시간은 빼고 처음부터 센다
    const hasData = audio.readyState >= HAVE_CURRENT_DATA;
    if (hasData !== hadData) {
      hadData = hasData;
      stillMs = 0;
    }
    stillMs += STALL_CHECK_MS;
    if (stillMs < (hasData ? STALL_MS : STALL_LOADING_MS)) return;
    stalled = true;
    onStall({
      started,
      positionMs: Math.round(audio.currentTime * 1000),
      readyState: audio.readyState,
      networkState: audio.networkState,
      paused: audio.paused,
      lastMediaEvent,
    });
  };

  const timer = setInterval(check, STALL_CHECK_MS);
  const stop = () => {
    clearInterval(timer);
    for (const type of STALL_MEDIA_EVENTS)
      audio.removeEventListener(type, rememberEvent);
    document.removeEventListener('visibilitychange', restartCount);
  };
  for (const type of STALL_MEDIA_EVENTS)
    audio.addEventListener(type, rememberEvent);
  document.addEventListener('visibilitychange', restartCount);
  return stop;
};

// 합성 응답을 기다리는 한도 — 망이 죽어 대화가 멈추는 것만 막는다. 느린 합성(실측 최대 21초)은 끊지 않는다
const SYNTH_TIMEOUT_MS = 25_000;

/** 합성 응답이 제한 시간 안에 오지 않았다 — 망이 죽었을 가능성이 커서 호출부는 더 기다리지 않는다 */
export class TtsTimeoutError extends Error {
  constructor() {
    super('TTS 합성 응답이 오지 않아요.');
  }
}

/** 다시 물어도 합성 요청이 한도에 걸렸다 — 몰린 상태라 호출부가 처음부터 다시 묻지 않는다 */
export class TtsRateLimitError extends Error {
  constructor() {
    super('TTS 합성 요청이 한도에 걸렸어요.');
  }
}

// 제공사 동시 요청 한도(429)에 걸렸을 때 다시 묻기 전 쉬는 시간 — 바로 다시 물으면 또 걸리기 쉽다
const RATE_LIMIT_RETRY_DELAYS_MS = [500, 1500];

// 쉬는 동안 재생이 멈추면 다시 묻지 않게 함께 끊긴다
const waitBeforeRetry = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    // 같이 거절된 요청이 같은 순간에 다시 몰리지 않게 쉬는 시간을 흩는다
    const timer = setTimeout(resolve, ms * (1 + Math.random()));
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });

// 합성 음원을 남겨 두는 개수 — 다시 듣기와 미리 받은 다음 발화의 문장 조각이 넉넉히 들어가는 크기다
const CACHE_LIMIT = 12;

const toPlayback = (audio: HTMLAudioElement): TtsPlayback => ({
  progress: () => (audio.duration ? audio.currentTime / audio.duration : 0),
  source: audio.currentSrc,
});

// 재생 없이 버려지는 프리로드는 네트워크 로드까지 끊는다 — src를 비운 load()가 표준 중단 관용구다
const abortPreload = (audio: HTMLAudioElement) => {
  audio.removeAttribute('src');
  audio.load();
};

const trimCache = (cache: Map<string, Blob>) => {
  for (const key of cache.keys()) {
    if (cache.size <= CACHE_LIMIT) return;
    cache.delete(key);
  }
};

// 캐시 키 — 같은 문장도 목소리(모델·화자)가 다르면 다른 음원이다
const cacheKey = (text: string, voice: TtsVoice) =>
  `${voice.model}/${voice.providerVoiceId}\n${text}`;

// 합성 요청을 한 곳에서 만든다 — 재생(speak)과 미리 담기(prefetch)가 공유한다.
// 성공 시 오디오 Blob을, 실패 시 예외를 던진다. objectURL은 재생 직전에 새로 만든다
// (iOS WebView는 미리 만들어 묵힌 blob URL 재생이 불안정해서다).
async function requestSpeech(
  text: string,
  voice: TtsVoice,
  signal?: AbortSignal,
): Promise<Blob> {
  const send = () =>
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: text,
        model: voice.model,
        voice: voice.providerVoiceId,
      }),
      signal,
    });
  let response = await send();
  for (const delay of RATE_LIMIT_RETRY_DELAYS_MS) {
    if (response.status !== 429) break;
    await waitBeforeRetry(delay, signal);
    response = await send();
  }
  if (response.status === 429) throw new TtsRateLimitError();
  if (!response.ok) {
    throw new Error(`TTS 합성에 실패했어요. (${response.status})`);
  }
  return response.blob();
}

// 응답이 영영 안 오면 대화가 그 자리에서 멈춘다 — 제한 시간이 지나면 실패로 돌려 다음으로 넘어가게 한다
async function synthesizeSpeech(
  text: string,
  voice: TtsVoice,
  signal?: AbortSignal,
): Promise<Blob> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort);
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    abort();
  }, SYNTH_TIMEOUT_MS);
  try {
    return await requestSpeech(text, voice, controller.signal);
  } catch (error) {
    throw timedOut ? new TtsTimeoutError() : error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

/**
 * TTS 합성·재생 훅. 재생 소유권(오디오 엘리먼트·objectURL)은 훅이 쥐고, 밖에는 읽기 전용 통로만 내준다.
 *
 * @returns `speak`(합성 후 재생 — prefetch 캐시가 있으면 왕복 없이 즉시), `speakSrc`(정적 파일 재생 — prefetchSrc 슬롯이 있으면 바로),
 *   `prefetch`(미리 합성해 캐시), `prefetchSrc`(정적 음원 미리 열기), `stop`(재생 중단·리소스 정리), `status`(idle→loading→active, 실패 시 error)
 */
export function useTts() {
  const [status, setStatus] = useState<TtsStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const onEndRef = useRef<(() => void) | undefined>(undefined);

  // 합성 오디오 캐시(키→Blob) — 미리 받은 다음 발화와 최근에 튼 문장들을 담는다.
  // 튼 것을 남기는 이유는 다시 듣기 — 합성 왕복 없이 바로 튼다. 오래된 것부터 비워 메모리가 늘지 않는다
  const cacheRef = useRef<Map<string, Blob>>(new Map());
  // prefetch 진행 중인 합성(키→Promise) — speak가 겹치면 새로 합성하지 말고 이 Promise를 기다린다
  const inflightRef = useRef<Map<string, Promise<Blob>>>(new Map());
  // 미리 받는 합성의 중단 손잡이 — 화면을 떠나면 아직 안 끝난 합성을 끊어 비용을 아낀다
  const prefetchAbortRef = useRef<AbortController | null>(null);
  // 미리 열어둔 정적 오디오 한 슬롯 — 이어 재생 때 네트워크 대기 없이 바로 튼다. 필요한 건 늘 다음 발화 하나다
  const preloadedRef = useRef<{ src: string; audio: HTMLAudioElement } | null>(
    null,
  );
  const mountedRef = useRef(true);
  // 지금 재생의 멈춤 감시를 끝내는 손잡이 — 재생이 끝나거나 바뀌면 함께 끝낸다
  const stopStallWatchRef = useRef<(() => void) | null>(null);

  const stopStallWatch = () => {
    stopStallWatchRef.current?.();
    stopStallWatchRef.current = null;
  };
  // 재생을 거는 순간부터 감시한다 — 시작을 못 하고 멈춘 것도 잡아야 한다
  const startStallWatch = (
    audio: HTMLAudioElement,
    { onStall, onResume }: SpeakOptions = {},
  ) => {
    stopStallWatch();
    if (onStall)
      stopStallWatchRef.current = watchStall(audio, { onStall, onResume });
  };

  // 재생 리소스(오디오·objectURL·콜백·멈춤 감시)를 정리한다. stop과 onended가 공유하는 뒷정리.
  // 멈춘 엘리먼트의 늦은 이벤트(버퍼링 중 네트워크 끊김 등)는 떼어낸다 — 프리로드 폴백이 다시 열어 재생을 되살리면 안 된다
  const cleanup = () => {
    stopStallWatch();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.onended = null;
      audio.onerror = null;
    }
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
    mountedRef.current = true; // StrictMode의 mount→unmount→mount에서 두 번째 mount가 죽은 채 남지 않게
    prefetchAbortRef.current = new AbortController();
    // 캐시 Map은 재할당되지 않으므로 진입 시 지역변수로 잡아 cleanup에서 그대로 정리한다
    const cache = cacheRef.current;
    return () => {
      mountedRef.current = false;
      stopStallWatchRef.current?.();
      abortRef.current?.abort();
      prefetchAbortRef.current?.abort();
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      cache.clear(); // 캐시엔 Blob만 담으므로 정리할 objectURL이 없다
      // 안 튼 프리로드가 화면을 떠난 뒤에도 내려받는 것 방지
      if (preloadedRef.current) abortPreload(preloadedRef.current.audio);
      preloadedRef.current = null;
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
      //   1) 캐시에 있으면 그대로 (네트워크 없음) — 미리 받아 둔 다음 발화, 또는 방금 튼 발화(다시 듣기)
      //   2) prefetch가 아직 합성 중이면 그 Promise를 재사용 — 새로 합성하면 이미 진행한
      //      시간을 버려 2번째+ 발화가 매번 느려진다 (디바이스는 합성이 길어 특히 심함)
      //   3) 둘 다 없으면 새로 합성
      const key = cacheKey(text, voice);
      let blob = cacheRef.current.get(key);
      if (!blob) {
        // 진행 중인 prefetch가 있으면 재사용하고, 그 합성이 실패했을 때만 새로 합성한다 (시간 초과와 한도 초과는 다시 묻지 않는다).
        // (prefetch가 없으면 곧장 새로 합성 — 이 경우 stop() abort가 그대로 전파돼야 한다)
        const pending = inflightRef.current.get(key);
        blob = pending
          ? await pending.catch((error) => {
              if (
                error instanceof TtsTimeoutError ||
                error instanceof TtsRateLimitError
              )
                throw error;
              return synthesizeSpeech(text, voice, controller.signal);
            })
          : await synthesizeSpeech(text, voice, controller.signal);
      }
      // 합성 도중 다른 speak/stop으로 밀려났으면 조용히 빠진다 (아직 URL을 안 만들었다)
      if (abortRef.current !== controller) return;
      // 방금 튼 것을 맨 뒤로 옮겨 가장 늦게 비워지게 한다
      cacheRef.current.delete(key);
      cacheRef.current.set(key, blob);
      trimCache(cacheRef.current);

      // URL은 재생 직전에 새로 만든다 — 묵힌 blob URL 재생 불안정(iOS) 회피
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      onEndRef.current = options?.onEnd;

      const audio = new Audio(url);
      audio.playbackRate = getSpeechRate();
      audioRef.current = audio;
      // 재생 실패는 onerror와 play() 거부 양쪽으로 도착할 수 있다 — 실패 콜백은 한 번만 부른다
      let handled = false;
      audio.onended = () => {
        if (handled) return;
        handled = true;
        cleanup();
        setStatus('idle');
        options?.onEnd?.();
      };
      audio.onerror = () => {
        if (handled) return;
        handled = true;
        cleanup();
        setStatus('error');
        const playbackError = new Error('오디오 재생에 실패했어요.');
        reportWarning(playbackError);
        options?.onError?.(playbackError);
      };

      startStallWatch(audio, options);
      try {
        await audio.play();
      } catch (error) {
        // onerror가 먼저 처리한 재생 실패면 여기서는 더 하지 않는다
        if (handled) return;
        handled = true;
        // 실패는 실패로만 알린다 — 감시가 남으면 뒤늦게 멈춤까지 알린다
        stopStallWatch();
        throw error;
      }
      if (handled) return;
      setStatus('active');
      options?.onStart?.(toPlayback(audio));
    } catch (error) {
      // stop()으로 중단된 경우는 에러가 아니다.
      // 뒤이은 speak가 이미 새 요청을 걸었으면(abortRef가 다른 컨트롤러) 상태는 그 요청이 소유하므로 건드리지 않는다
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (abortRef.current === null) setStatus('idle');
        return;
      }
      // 이미 밀려난 재생의 뒤늦은 실패 — 지금 재생의 상태를 덮거나 오류로 보고하지 않는다
      if (abortRef.current !== controller) return;
      setStatus('error');
      reportWarning(error);
      options?.onError?.(
        error instanceof Error ? error : new Error('TTS 합성에 실패했어요.'),
      );
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  // 미리 만들어둔 정적 오디오(서버 질문 음원, 스몰톡 자기소개 mp3)를 URL로 바로 재생한다 — 합성 없음.
  // 파일이 없으면(404 등) onError로 알려, 호출부가 런타임 합성으로 폴백할 수 있게 한다.
  const speakSrc = (src: string, options?: SpeakOptions) => {
    stop();
    setStatus('loading');
    onEndRef.current = options?.onEnd;

    // 미리 열어둔(prefetchSrc) 엘리먼트가 있으면 그대로 재생한다 — 이어 재생 때 네트워크 대기가 없다
    const preloaded =
      preloadedRef.current?.src === src ? preloadedRef.current.audio : null;
    if (preloaded) preloadedRef.current = null;

    const start = (audio: HTMLAudioElement, isPreloaded: boolean) => {
      // 배속은 재생 직전에 읽는다 — prefetchSrc로 미리 연 엘리먼트는 그 사이 설정이 바뀌었을 수 있다
      audio.playbackRate = getSpeechRate();
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
        // 프리로드해 둔 엘리먼트는 묵는 동안 로드가 죽었을 수 있다 — 새 엘리먼트로 한 번 다시 연다
        if (isPreloaded) {
          audio.pause();
          start(new Audio(src), false);
          return;
        }
        cleanup();
        setStatus('error');
        options?.onError?.(new Error('오디오 재생에 실패했어요.'));
      };
      audio.onerror = fail;
      startStallWatch(audio, options);
      audio.play().then(
        () => {
          if (!handled) {
            setStatus('active');
            options?.onStart?.(toPlayback(audio));
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
    start(preloaded ?? new Audio(src), preloaded != null);
  };

  // 미리 합성해 캐시에 담아둔다 — 다음 speak를 즉시 재생시켜 재생 지연을 없앤다.
  // 재생 중인 요청과 독립적으로 동작하고, 실패는 조용히 무시한다(speak가 다시 시도한다).
  const prefetch = async (text: string, voice: TtsVoice | null) => {
    if (!voice || !text) return;
    const key = cacheKey(text, voice);
    if (cacheRef.current.has(key)) return;
    // 이미 합성 중이면 끝날 때까지 기다린다 — 호출부가 동시 요청 수를 셀 수 있어야 한다
    const running = inflightRef.current.get(key);
    if (running) {
      await running.catch(() => {});
      return;
    }
    // 합성 Promise를 inflight에 등록해 둔다 — 완료 전에 speak가 겹치면 이 Promise를 그대로 재사용한다
    const pending = synthesizeSpeech(
      text,
      voice,
      prefetchAbortRef.current?.signal,
    )
      .then((blob) => {
        // 언마운트된 뒤 도착한 응답은 캐시에 담지 않는다 (Blob이라 정리할 것 없음)
        if (mountedRef.current) {
          cacheRef.current.set(key, blob);
          trimCache(cacheRef.current);
        }
        return blob;
      })
      .finally(() => {
        inflightRef.current.delete(key);
      });
    inflightRef.current.set(key, pending);
    // 프리페치 자체 실패는 조용히 무시한다(speak가 다시 합성한다)
    await pending.catch(() => {});
  };

  // 정적 음원을 미리 열어 로드해둔다 — 뒤이은 speakSrc가 네트워크 대기 없이 바로 튼다.
  // 새로 열 때 이전 항목은 로드를 끊고 슬롯을 비우고, 로드가 실패한 항목도 스스로 내려간다
  // (speakSrc가 새 엘리먼트로 열게). 언마운트 뒤 도착한 요청은 슬롯을 되살리지 않는다
  const prefetchSrc = (src: string) => {
    if (!mountedRef.current || preloadedRef.current?.src === src) return;
    if (preloadedRef.current) abortPreload(preloadedRef.current.audio);
    // preload 힌트는 src를 주기 전에 걸어야 로드 시작부터 적용된다
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = src;
    audio.onerror = () => {
      if (preloadedRef.current?.audio === audio) preloadedRef.current = null;
    };
    preloadedRef.current = { src, audio };
  };

  // 중단은 '재생 완료'가 아니다 — onEnd는 오디오가 실제로 끝났을 때(onended)만 부른다.
  // (effect 정리·언마운트·StrictMode 재실행에서 stop이 불려도 대화가 advance되면 안 된다)
  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    cleanup(); // onEndRef도 지워 다시 불리지 않게 한다
    setStatus('idle');
  };

  return { speak, speakSrc, prefetch, prefetchSrc, stop, status };
}
