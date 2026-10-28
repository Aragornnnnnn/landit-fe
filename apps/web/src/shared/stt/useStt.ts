'use client';

// Deepgram 실시간 STT 세션의 수명을 관리하는 훅 — 실패 시 브라우저 SpeechRecognition으로 폴백.
// 인식 텍스트·에러는 콜백으로만 흘린다 — 화면 상태는 소비자(대화 입력)가 갖는다.
import { useEffect, useRef } from 'react';

import {
  startDeepgramStt,
  type SttHandlers,
  type SttResultMeta,
  type SttSession,
} from './deepgram-stt';
import { MicPermissionDeniedError } from './errors';
import { startWebSpeech } from './web-speech-fallback';

// 계측용 — 실패 시점에 어느 엔진으로 듣고 있었는가
export interface SttErrorMeta {
  engine: SttResultMeta['engine'];
}

export interface UseSttOptions {
  lang?: string;
  endpointingMs?: number;
  stopOnSilence?: boolean; // false면 stop()까지 계속 듣는다 (기본 true)
  keyterms?: readonly string[]; // Deepgram에만 실린다 — 폴백(브라우저 인식)은 받지 않는다
  onFinal?: (transcript: string, meta: SttResultMeta) => void;
  onInterim?: (transcript: string, pending: boolean) => void;
  onError?: (error: Error, meta: SttErrorMeta) => void;
}

// 영어 말하기 연습 제품이라 영어가 기본 — 한국어 받아쓰기가 필요한 기능은 lang: 'ko'로 덮어쓴다
const DEFAULT_LANG = 'en-US';
// 이만큼 말이 멈추면 발화 종료로 판단
const DEFAULT_ENDPOINTING_MS = 2000;

export function useStt(options: UseSttOptions = {}) {
  const {
    lang = DEFAULT_LANG,
    endpointingMs = DEFAULT_ENDPOINTING_MS,
    stopOnSilence = true,
    keyterms,
    onFinal,
    onInterim,
    onError,
  } = options;

  const sessionRef = useRef<SttSession | null>(null);
  // 세대 번호 — 시작마다 뽑고 취소가 올린다. 시작(권한→토큰→연결)이 비동기라 "연결 중 취소"가
  // 가능해서, 번호가 달라진 채 뒤늦게 완성된 세션은 스스로 파기된다.
  const generationRef = useRef(0);
  // 연결 중에 완료(stop)가 불렸는가 — 세션이 없어 그 자리에서 씹히지 않도록, 설치되는 순간 확정 처리를 예약해둔다
  const pendingStopRef = useRef(false);

  // 세션 콜백은 훅 밖 수명이라 사용자 콜백 최신값을 ref로 잡아 stale closure 방지
  const callbacksRef = useRef({ onFinal, onInterim, onError });
  useEffect(() => {
    callbacksRef.current = { onFinal, onInterim, onError };
  });

  // 지금 듣고 있는 엔진 — Deepgram으로 시작했다가 실패하면 폴백으로 바뀐다
  const engineRef = useRef<SttResultMeta['engine']>('deepgram');

  const failWith = (err: Error) => {
    sessionRef.current = null;
    callbacksRef.current.onError?.(err, { engine: engineRef.current });
  };

  const start = async () => {
    if (sessionRef.current) return;
    const gen = ++generationRef.current;
    pendingStopRef.current = false;
    engineRef.current = 'deepgram';

    // 파기된(구세대) 세션이 뒤늦게 내는 소리는 전부 무시한다
    const handlers: SttHandlers = {
      onInterim: (text, pending) => {
        if (generationRef.current !== gen) return;
        callbacksRef.current.onInterim?.(text, pending);
      },
      onFinal: (text, meta) => {
        if (generationRef.current !== gen) return;
        sessionRef.current = null;
        callbacksRef.current.onFinal?.(text, meta);
      },
      onError: (err) => {
        if (generationRef.current !== gen) return;
        failWith(err);
      },
    };

    const installIfCurrent = (session: SttSession) => {
      if (generationRef.current !== gen) {
        session.abort();
        return;
      }
      sessionRef.current = session;
      // 연결 중에 완료가 불렸으면 설치하자마자 확정한다. 확정을 기다리는 동안에도 취소(X)·이탈이
      // 이 세션에 닿아야 해서 담아 둔다 — 끝나면 onFinal·onError가 비워 다음 시작이 막히지 않는다
      if (pendingStopRef.current) session.stop();
    };

    try {
      installIfCurrent(
        await startDeepgramStt({
          ...handlers,
          lang,
          endpointingMs,
          stopOnSilence,
          keyterms,
        }),
      );
    } catch (deepgramErr) {
      if (generationRef.current !== gen) return; // 취소된 시작의 실패는 조용히 무시
      // 마이크 권한 거부는 폴백도 동일하게 막히므로 바로 에러
      if (
        deepgramErr instanceof DOMException &&
        deepgramErr.name === 'NotAllowedError'
      ) {
        failWith(new MicPermissionDeniedError());
        return;
      }
      // 미지원(iOS WKWebView 등)·토큰 실패 → 브라우저 SpeechRecognition 폴백
      engineRef.current = 'web_speech';
      try {
        installIfCurrent(startWebSpeech({ ...handlers, lang, stopOnSilence }));
      } catch (fallbackErr) {
        failWith(fallbackErr as Error);
      }
    }
  };

  /** 확정 (완료 ■) — 남은 인식까지 반영해 onFinal이 한 번 온다 */
  const stop = () => {
    pendingStopRef.current = true;
    sessionRef.current?.stop();
  };

  /** 파기 (취소 X) — onFinal 없이 즉시 정리되고, 결과를 안 기다리므로 곧바로 재시작할 수 있다 */
  const abort = () => {
    generationRef.current += 1; // 진행 중인 시작도 이 순간 무효가 된다
    sessionRef.current?.abort();
    sessionRef.current = null;
  };

  // 언마운트는 파기 — 떠난 화면의 인식 결과가 제출로 이어지면 안 된다
  useEffect(() => {
    return () => {
      generationRef.current += 1;
      sessionRef.current?.abort();
      sessionRef.current = null;
    };
  }, []);

  return { start, stop, abort };
}
