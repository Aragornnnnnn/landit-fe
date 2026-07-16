// 속마음 폴링 훅 — 제출 응답의 속마음이 준비됐으면 그대로, 아직이면(PREPARING) 완료까지 조회해 돌려준다
'use client';

import { useEffect, useRef } from 'react';

import { getInnerThought, type SubmittedMessage } from '../api/session';
import { innerThoughtMaxPolls, innerThoughtPollMs } from './pacing';

// 폴링 간격만큼 기다린다
const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// 노출할 속마음 — 텍스트와 종류(백엔드 문자열 그대로, 좁히기는 소비 지점에서)
export interface ResolvedThought {
  text: string;
  type: string | null;
}

export const useInnerThought = () => {
  // 이탈·언마운트 뒤 도착한 폴링 결과가 죽은 화면을 건드리지 않게 하는 활성 플래그.
  // StrictMode 재실행(setup→cleanup→setup)에도 다시 true로 돌려 폴링이 죽지 않게 한다.
  const activeRef = useRef(true);
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  // 제출 응답의 속마음이 COMPLETED면 즉시, 아직이면 0.5s 간격으로 폴링해 완료되면 돌려준다.
  // 이탈했으면 null을 돌려 호출부가 노출하지 않게 한다. 실패/시간초과는 제출 응답 값으로 폴백한다.
  const resolve = async (
    sessionId: number,
    submitted: SubmittedMessage,
  ): Promise<ResolvedThought | null> => {
    if (submitted.innerThoughtProcessingStatus === 'COMPLETED') {
      return { text: submitted.innerThought, type: submitted.innerThoughtType };
    }
    for (let i = 0; i < innerThoughtMaxPolls; i++) {
      await delay(innerThoughtPollMs);
      if (!activeRef.current) return null;
      try {
        const res = await getInnerThought(sessionId, submitted.messageId);
        if (res.processingStatus === 'COMPLETED') {
          return { text: res.innerThought ?? '', type: res.innerThoughtType };
        }
        if (res.processingStatus === 'FAILED') break;
      } catch {
        // 일시적 오류는 다음 폴에서 다시 시도한다
      }
    }
    if (!activeRef.current) return null;
    return { text: submitted.innerThought, type: submitted.innerThoughtType };
  };

  // 중도 이탈 시 진행 중인 폴링을 즉시 멈춘다 (언마운트를 기다리지 않고)
  const cancel = () => {
    activeRef.current = false;
  };

  return { resolve, cancel };
};
