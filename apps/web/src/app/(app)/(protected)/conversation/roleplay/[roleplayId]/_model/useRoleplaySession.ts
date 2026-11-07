// 롤플레이 세션 시작 — 진입하자마자 저장한 시나리오로 세션을 열고, 열릴 때까지 화면은 기다린다.
// 상대의 첫 마디를 서버가 그때 만든다(스몰톡과 같다)
'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { EVENTS, type EventProps, type RoleplayEntry } from '@landit/analytics';
import { useQueryClient } from '@tanstack/react-query';

import {
  startSavedRoleplaySession,
  type RoleplaySessionStartResponse,
  type RoleplaySettings,
} from '@/features/roleplay/api/roleplay';
import { roleplayKeys } from '@/features/roleplay/model/keys';
import { isPremiumRequired } from '@/features/roleplay/model/premium-required';
import { useRoleplayGate } from '@/features/roleplay/model/useRoleplayGate';
import { useRoleplaySessionHandoff } from '@/features/roleplay/model/useRoleplaySessionHandoff';
import { toPartnerId } from '@/features/small-talk/model/partner';
import { track } from '@/shared/analytics';
import { ApiError } from '@/shared/api/api-error';
import { useCurrentUserId } from '@/shared/auth/current-member';
import { roleplayTalkPath } from '@/shared/lib/routes';
import { reportError } from '@/shared/monitoring/report';

import { findCachedPartner } from './cached-partner';

const toStartFailReason = (
  cause: unknown,
): EventProps['Roleplay Start Failed']['reason'] => {
  if (isPremiumRequired(cause)) return 'premium_required';
  if (cause instanceof ApiError && cause.status === 404) return 'not_found';
  return 'error';
};

export const useRoleplaySession = (
  roleplayId: number,
  entry: RoleplayEntry,
) => {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  const handoff = useRoleplaySessionHandoff();
  const { freeUser, deciding } = useRoleplayGate();
  // 만들기 화면이 미리 열어 뒀으면 기다림 없이 바로 대화한다
  const [session, setSession] = useState<RoleplaySessionStartResponse | null>(
    () => handoff.peek(roleplayId),
  );
  const [error, setError] = useState<unknown>(null);
  const startedRef = useRef(false);
  const trackedRef = useRef(false);

  const trackStartFailed = useEffectEvent((cause: unknown) =>
    track(EVENTS.ROLEPLAY_START_FAILED, {
      roleplay_id: roleplayId,
      entry,
      reason: toStartFailReason(cause),
      free_trial: freeUser,
    }),
  );

  useEffect(() => {
    if (startedRef.current) return; // StrictMode 이중 실행에도 세션은 하나만 만든다
    startedRef.current = true;

    if (session) {
      handoff.clear(roleplayId);
      return;
    }

    startSavedRoleplaySession(roleplayId)
      .then(setSession)
      .catch((cause) => {
        trackStartFailed(cause);
        // 프리미엄 거절은 오류가 아니다 — 화면이 페이월로 보낸다. 가진 무료 기회 값은 낡은 것이다
        if (isPremiumRequired(cause)) {
          void queryClient.invalidateQueries({
            queryKey: roleplayKeys.access(userId),
          });
        } else {
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

  // 첫 발화까지 받으면 무료 기회를 쓴 것이다 — 돌아간 입구가 다시 묻게 한다
  const sessionOpened = session !== null;
  useEffect(() => {
    if (!sessionOpened) return;
    void queryClient.invalidateQueries({
      queryKey: roleplayKeys.access(userId),
    });
  }, [sessionOpened, queryClient, userId]);

  // 구독을 받기 전엔 무료 사용자인지 몰라, free_trial이 false로 잘못 찍히지 않게 판단이 선 뒤에 찍는다
  useEffect(() => {
    if (!session || deciding || trackedRef.current) return;
    trackedRef.current = true;
    track(EVENTS.ROLEPLAY_STARTED, {
      session_id: session.sessionId,
      roleplay_id: roleplayId,
      partner: toPartnerId(session.character?.characterId ?? null),
      free_trial: freeUser,
      entry,
    });
    // 새로고침으로 다시 열면 만든 직후가 아니다 — 주소에서 표시를 지운다
    if (entry === 'created') {
      window.history.replaceState(null, '', roleplayTalkPath(roleplayId));
    }
  }, [session, deciding, freeUser, entry, roleplayId]);

  // 세션을 기다리는 동안 세울 상대 — 목록을 새로 받진 않고 홈이 받아 둔 것만 본다
  const [partner] = useState(() =>
    findCachedPartner(
      queryClient.getQueryData<RoleplaySettings[]>(
        roleplayKeys.scenarios(userId),
      ),
      roleplayId,
    ),
  );

  // 중도 종료는 없다 — 백엔드가 롤플레이 세션의 중도 종료를 받지 않아, 완료는 끝내기(complete)만 맡는다
  return { session, error, partner };
};
