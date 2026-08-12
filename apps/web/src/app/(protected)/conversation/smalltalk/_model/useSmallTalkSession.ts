// 스몰톡 세션 시작 — 진입하자마자 세션을 만들고, 만들어질 때까지 화면은 기다린다.
// 시나리오와 달리 미리 보여줄 오프닝이 캐시에 없다(상대의 첫 마디를 서버가 그때 만든다).
'use client';

import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { endSession } from '@/features/conversation/api/session';
import type { Partner } from '@/features/conversation/model/character-look';
import { track } from '@/shared/analytics';
import { reportError, reportWarning } from '@/shared/monitoring/report';

import {
  startSmallTalkSession,
  type SmallTalkSessionStartResponse,
  type SmallTalkStartMode,
} from '@/features/small-talk/api/small-talk';

interface SmallTalkSessionOptions {
  startMode: SmallTalkStartMode;
  // 상대가 먼저 말을 걸 때 고른 주제. 내가 먼저 걸면 없다
  topicId?: number;
  // 홈에서 고른 상대 — 계측에만 쓴다. 서버는 아직 상대 개념을 모른다
  partner: Partner;
}

export const useSmallTalkSession = ({
  startMode,
  topicId,
  partner,
}: SmallTalkSessionOptions) => {
  const [session, setSession] = useState<SmallTalkSessionStartResponse | null>(
    null,
  );
  const [error, setError] = useState<unknown>(null);
  // 시작한 세션 id — 나갈 때 종료하려면 언마운트 시점에도 최신 값을 읽을 수 있어야 한다
  const sessionIdRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return; // StrictMode 이중 실행에도 세션은 하나만 만든다
    startedRef.current = true;

    startSmallTalkSession({ startMode, topicId })
      .then((started) => {
        sessionIdRef.current = started.sessionId;
        setSession(started);
        track(EVENTS.SMALL_TALK_STARTED, {
          session_id: started.sessionId,
          partner,
          first_speaker: startMode === 'AI_FIRST' ? 'AI' : 'USER',
          ...(topicId !== undefined && { topic_id: topicId }),
        });
      })
      .catch((cause) => {
        console.warn('[smalltalk] 세션 시작 실패', cause);
        reportError(cause);
        setError(cause);
      });
  }, [startMode, topicId, partner]);

  // 중도 종료 — 정상 완료는 서버가 판정하므로 부르지 않는다
  const end = () => {
    if (sessionIdRef.current == null) return;
    endSession(sessionIdRef.current).catch((cause) => {
      console.warn('[smalltalk] 세션 종료 실패', cause);
      reportWarning(cause);
    });
  };

  return { session, error, end };
};
