// 대화 한 건의 상세 조회 — 대화 직후 축하 화면과 지난 스몰톡 상세가 같은 응답을 나눠 쓴다.
// 맞춤 표현은 대화가 끝난 뒤 서버가 따로 만들기 때문에, 준비될 때까지(PREPARING) 다시 물어야 한다
'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';
import { reportWarning } from '@/shared/monitoring/report';

import {
  getSmallTalkSession,
  retrySmallTalkExpressions,
} from '../api/small-talk';
import { smallTalkKeys } from './keys';

// 다시 묻는 간격. 표현 생성은 대화 길이에 따라 길어질 수 있어 너무 촘촘하면 헛물만 켠다
const POLL_MS = 1_000;
// 기다림의 상한. 이만큼 기다려도 안 끝나면 기다리는 화면에 가두지 않고 다시 만들기를 권한다
export const WAIT_LIMIT_MS = 60_000;

export const useSmallTalkSessionQuery = (sessionId: number) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const queryClient = useQueryClient();
  const queryKey = smallTalkKeys.session(userId, sessionId);

  // 기다린 지 오래됐는가 — 상한을 넘기면 그만 묻는다
  const [waitedTooLong, setWaitedTooLong] = useState(false);
  // 실패를 되살려 본 적이 있는가 — 한 번만 다시 걸고, 그 답이 올 때까지는 아직 실패로 치지 않는다
  const revivalTriedRef = useRef(false);
  const [revivalSettled, setRevivalSettled] = useState(false);

  const { data, error, isPending, refetch } = useQuery({
    queryKey,
    queryFn: () => getSmallTalkSession(sessionId),
    // 아직 만드는 중이면 1초 뒤 다시 조회한다.
    // 준비가 끝났거나(READY·FAILED) 상한까지 기다렸으면 false를 돌려 멈춘다
    refetchInterval: (query) =>
      query.state.data?.expressionGenerationStatus === 'PREPARING' &&
      !waitedTooLong
        ? POLL_MS
        : false,
  });

  const preparing = data?.expressionGenerationStatus === 'PREPARING';
  // 다시 만들기 시작하면 기다림도 처음부터다
  if (!preparing && waitedTooLong) setWaitedTooLong(false);
  useEffect(() => {
    if (!preparing) return;
    const limit = setTimeout(() => setWaitedTooLong(true), WAIT_LIMIT_MS);
    return () => clearTimeout(limit);
  }, [preparing]);

  // 생성이 실패하면 한 번은 조용히 다시 걸어 본다 — 사용자에게 버튼을 떠넘기기 전에 해볼 수 있는 일이다.
  // 다시 걸어도 실패하면 그때 포기한다
  const failed = data?.expressionGenerationStatus === 'FAILED';
  useEffect(() => {
    if (!failed || revivalTriedRef.current) return;
    revivalTriedRef.current = true;
    retrySmallTalkExpressions(sessionId)
      .then(() => refetch())
      .catch(reportWarning)
      .finally(() => setRevivalSettled(true));
  }, [failed, sessionId, refetch]);

  return {
    session: data ?? null,
    error,
    isLoading: isPending,
    // 더 기다려도 소용없는 상태 — 다시 걸어 봐도 실패했거나, 상한까지 기다렸는데도 안 끝났거나.
    // 붙잡아 두지 않고 "나중에 만들어 둘게요"로 보낸다 — 만들어지면 기록에 남는다
    generationStuck: waitedTooLong || (failed && revivalSettled),
    retry: () => void refetch(),
    // 다시 만들기 — 서버는 접수만 하고 뒤에서 만든다. 상태를 다시 받아 폴링을 잇는다.
    // 대화 직후 화면은 알아서 한 번 걸어 보므로, 이 버튼은 기록에서 다시 시도할 때 쓴다
    regenerate: async () => {
      await retrySmallTalkExpressions(sessionId);
      await queryClient.invalidateQueries({ queryKey });
    },
  };
};
