'use client';

// Deepgram 실시간 STT를 상태로 감싼 재사용 훅 — 실패 시 브라우저 SpeechRecognition으로 폴백
import { useEffect, useRef, useState } from 'react';

import {
  startDeepgramStt,
  type SttHandlers,
  type SttSession,
} from './deepgram-stt';
import { startWebSpeech } from './web-speech-fallback';

export type SttStatus = 'idle' | 'connecting' | 'listening' | 'error';

export interface UseSttOptions {
  lang?: string;
  endpointingMs?: number;
  // false면 침묵 자동 종료 없이 stop() 호출까지 계속 듣는다 (기본 true)
  stopOnSilence?: boolean;
  onFinal?: (transcript: string) => void;
  onInterim?: (transcript: string) => void;
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
    onFinal,
    onInterim,
  } = options;

  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [status, setStatus] = useState<SttStatus>('idle');
  const [error, setError] = useState<Error | null>(null);

  const sessionRef = useRef<SttSession | null>(null);
  const startingRef = useRef(false);

  // 세션 콜백은 훅 밖 수명이라 사용자 콜백 최신값을 ref로 잡아 stale closure 방지
  const callbacksRef = useRef({ onFinal, onInterim });
  useEffect(() => {
    callbacksRef.current = { onFinal, onInterim };
  });

  const start = async () => {
    if (sessionRef.current || startingRef.current) return;
    startingRef.current = true;
    setStatus('connecting');
    setError(null);
    setTranscript('');
    setInterim('');

    const handlers: SttHandlers = {
      onInterim: (text) => {
        setInterim(text);
        callbacksRef.current.onInterim?.(text);
      },
      onFinal: (text) => {
        sessionRef.current = null;
        setInterim('');
        setTranscript(text);
        setStatus('idle');
        callbacksRef.current.onFinal?.(text);
      },
      onError: (err) => {
        sessionRef.current = null;
        setInterim('');
        setError(err);
        setStatus('error');
      },
    };

    try {
      sessionRef.current = await startDeepgramStt({
        ...handlers,
        lang,
        endpointingMs,
        stopOnSilence,
      });
      setStatus('listening');
    } catch (deepgramErr) {
      // 마이크 권한 거부는 폴백도 동일하게 막히므로 바로 에러
      if (
        deepgramErr instanceof DOMException &&
        deepgramErr.name === 'NotAllowedError'
      ) {
        setError(new Error('마이크 권한이 거부되었습니다.'));
        setStatus('error');
        return;
      }
      // 미지원(iOS WKWebView 등)·토큰 실패 → 브라우저 SpeechRecognition 폴백
      try {
        sessionRef.current = startWebSpeech({
          ...handlers,
          lang,
          stopOnSilence,
        });
        setStatus('listening');
      } catch (fallbackErr) {
        setError(fallbackErr as Error);
        setStatus('error');
      }
    } finally {
      startingRef.current = false;
    }
  };

  const stop = () => {
    sessionRef.current?.stop();
  };

  const reset = () => {
    if (sessionRef.current) return;
    setTranscript('');
    setInterim('');
    setError(null);
    setStatus('idle');
  };

  // 언마운트 정리
  useEffect(() => {
    return () => {
      sessionRef.current?.stop();
      sessionRef.current = null;
    };
  }, []);

  return {
    transcript,
    interim,
    status,
    error,
    isListening: status === 'listening',
    start,
    stop,
    reset,
  };
}
