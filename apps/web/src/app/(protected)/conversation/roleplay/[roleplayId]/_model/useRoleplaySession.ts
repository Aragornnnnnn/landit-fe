// 롤플레이 세션 시작 — 진입하자마자 저장한 시나리오로 세션을 열고, 열릴 때까지 화면은 기다린다.
// 상대의 첫 마디를 서버가 그때 만든다(스몰톡과 같다)
'use client';

import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';

import {
  startSavedRoleplaySession,
  type RoleplaySessionStartResponse,
} from '@/features/roleplay/api/roleplay';
import { toPartnerId } from '@/features/small-talk/model/partner';
import { track } from '@/shared/analytics';
import { reportError } from '@/shared/monitoring/report';

export const useRoleplaySession = (roleplayId: number) => {
  const [session, setSession] = useState<RoleplaySessionStartResponse | null>(
    null,
  );
  const [error, setError] = useState<unknown>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return; // StrictMode 이중 실행에도 세션은 하나만 만든다
    startedRef.current = true;

    startSavedRoleplaySession(roleplayId)
      .then((started) => {
        setSession(started);
        track(EVENTS.ROLEPLAY_STARTED, {
          session_id: started.sessionId,
          roleplay_id: roleplayId,
          partner: toPartnerId(started.character?.characterId ?? null),
        });
      })
      .catch((cause) => {
        console.warn('[roleplay] 세션 시작 실패', cause);
        reportError(cause);
        setError(cause);
      });
  }, [roleplayId]);

  // 중도 종료는 없다 — 백엔드가 롤플레이 세션의 중도 종료를 받지 않아, 완료는 끝내기(complete)만 맡는다
  return { session, error };
};
