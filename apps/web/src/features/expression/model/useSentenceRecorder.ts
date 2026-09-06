// 발음 발화 녹음 배선 훅 — 세션 수명(시작·확정·파기)과 마이크 권한 거부 판정을 관리한다
import { useEffect, useRef, useState } from 'react';

import { MicPermissionDeniedError } from '@/shared/stt/errors';

import {
  startSentenceRecording,
  type RecordingSession,
  type SentenceRecording,
} from '../lib/sentence-recording';

/**
 * 발음 발화 녹음 훅 — start(권한 요청 포함) → stop(녹음 확정) / abort(파기)로 세션을 관리한다.
 * 언마운트 시 진행 중 녹음을 파기해 마이크 인디케이터가 남지 않는다.
 *
 * @throws start()가 권한 거부 시 MicPermissionDeniedError — 소비 지점이 안내 시트를 띄운다
 */
export const useSentenceRecorder = () => {
  const sessionRef = useRef<RecordingSession | null>(null);
  // 시작(getUserMedia 권한 대기) 중 중복 호출 방지 — 세션이 생기기 전 공백을 막는다
  const startingRef = useRef(false);
  const unmountedRef = useRef(false);
  const [recording, setRecording] = useState(false);

  // 언마운트 시 진행 중 녹음 파기 — 화면 없이 마이크 인디케이터가 남지 않게.
  // StrictMode가 dev에서 이펙트를 정리→재실행으로 한 바퀴 돌리므로,
  // 마운트마다 표식을 되돌려야 재실행 후의 start()가 산 채로 남는다
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      sessionRef.current?.abort();
      sessionRef.current = null;
    };
  }, []);

  const start = async () => {
    if (sessionRef.current || startingRef.current) return;
    startingRef.current = true;
    try {
      const session = await startSentenceRecording();
      // 권한 대기 중 화면을 떠났으면 세션을 살리지 않는다
      if (unmountedRef.current) {
        session.abort();
        return;
      }
      sessionRef.current = session;
      setRecording(true);
    } catch (error) {
      // 권한 거부는 별도 타입으로 — 소비 지점이 문자열 매칭 없이 안내 시트를 띄운다
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        throw new MicPermissionDeniedError();
      }
      throw error;
    } finally {
      startingRef.current = false;
    }
  };

  const stop = async (): Promise<SentenceRecording | null> => {
    const session = sessionRef.current;
    if (!session) return null;
    sessionRef.current = null;
    setRecording(false);
    return session.stop();
  };

  const abort = () => {
    sessionRef.current?.abort();
    sessionRef.current = null;
    setRecording(false);
  };

  return { recording, start, stop, abort };
};
