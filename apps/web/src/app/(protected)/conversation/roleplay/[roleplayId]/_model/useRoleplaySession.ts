// 롤플레이 세션 시작 — 진입하자마자 저장한 시나리오로 세션을 열고, 열릴 때까지 화면은 기다린다.
// 상대의 첫 마디를 서버가 그때 만든다(스몰톡과 같다)
'use client';

import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useQueryClient } from '@tanstack/react-query';

import {
  startSavedRoleplaySession,
  type RoleplaySessionStartResponse,
} from '@/features/roleplay/api/roleplay';
import { roleplayKeys } from '@/features/roleplay/model/keys';
import { isPremiumRequired } from '@/features/roleplay/model/premium-required';
import { useRoleplaySessionHandoff } from '@/features/roleplay/model/useRoleplaySessionHandoff';
import { toPartnerId } from '@/features/small-talk/model/partner';
import { track } from '@/shared/analytics';
import { ApiError } from '@/shared/api/api-error';
import { useCurrentUserId } from '@/shared/auth/current-member';
import { reportError } from '@/shared/monitoring/report';

export const useRoleplaySession = (roleplayId: number) => {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  const handoff = useRoleplaySessionHandoff();
  // 만들기 화면이 미리 열어 뒀으면 기다림 없이 바로 대화한다
  const [session, setSession] = useState<RoleplaySessionStartResponse | null>(
    () => handoff.peek(roleplayId),
  );
  const [error, setError] = useState<unknown>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return; // StrictMode 이중 실행에도 세션은 하나만 만든다
    startedRef.current = true;

    const trackStarted = (started: RoleplaySessionStartResponse) => {
      track(EVENTS.ROLEPLAY_STARTED, {
        session_id: started.sessionId,
        roleplay_id: roleplayId,
        partner: toPartnerId(started.character?.characterId ?? null),
      });
      // 첫 발화까지 받으면 무료 기회를 쓴 것이다 — 돌아간 입구가 다시 묻게 한다
      void queryClient.invalidateQueries({
        queryKey: roleplayKeys.access(userId),
      });
    };

    if (session) {
      handoff.clear(roleplayId);
      trackStarted(session);
      return;
    }

    startSavedRoleplaySession(roleplayId)
      .then((started) => {
        setSession(started);
        trackStarted(started);
      })
      .catch((cause) => {
        // 프리미엄 거절은 오류가 아니다 — 화면이 페이월로 보낸다
        if (!isPremiumRequired(cause)) {
          console.warn('[roleplay] 세션 시작 실패', cause);
          reportError(cause);
        }
        setError(cause);
        // 다른 기기에서 지운 시나리오다 — 돌아간 홈에 옛 카드가 남지 않게 한다
        if (cause instanceof ApiError && cause.status === 404) {
          void queryClient.invalidateQueries({
            queryKey: roleplayKeys.scenarios(userId),
          });
        }
      });
  }, [roleplayId, queryClient, userId, handoff, session]);

  // 중도 종료는 없다 — 백엔드가 롤플레이 세션의 중도 종료를 받지 않아, 완료는 끝내기(complete)만 맡는다
  return { session, error };
};
