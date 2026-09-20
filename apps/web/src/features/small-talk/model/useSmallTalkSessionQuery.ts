// 대화 한 건의 상세 조회 — 대화 직후 축하 화면·지난 스몰톡 상세·대화 보기가 같은 응답을 나눠 쓴다.
// 맞춤 표현은 대화가 끝난 뒤 서버가 따로 만들기 때문에, 준비될 때까지(PREPARING) 다시 물어야 한다.
// 교정(더 자연스러운 말)도 따로 만들어지지만 그걸 그리는 화면은 대화 보기뿐이라, 교정 대기는 그 화면만 켠다
'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';
import { reportWarning } from '@/shared/monitoring/report';

import {
  getSmallTalkSession,
  retrySmallTalkExpressions,
  type SmallTalkSessionDetailResponse,
} from '../api/small-talk';
import { smallTalkKeys } from './keys';
import { hasPendingCorrection } from './message-feedback';

// 다시 묻는 간격. 표현 생성은 대화 길이에 따라 길어질 수 있어 너무 촘촘하면 헛물만 켠다
const POLL_MS = 1_000;
// 기다림의 상한. 이만큼 기다려도 안 끝나면 기다리는 화면에 가두지 않고 다시 만들기를 권한다
export const WAIT_LIMIT_MS = 60_000;

interface SessionQueryOptions {
  // 교정이 다 만들어질 때까지도 기다릴 것인가 — 교정을 그리는 화면(대화 보기)만 켠다.
  // 켜지 않은 화면은 표현만 기다리고, 교정이 늦어도 폴링을 더 돌지 않는다
  awaitCorrections?: boolean;
}

// 아직 더 물어야 하는가 — 표현이 아직이거나, (기다리기로 했다면) 교정이 아직이거나
const isStillPreparing = (
  session: SmallTalkSessionDetailResponse | undefined,
  awaitCorrections: boolean,
) =>
  session !== undefined &&
  (session.expressionGenerationStatus === 'PREPARING' ||
    (awaitCorrections && hasPendingCorrection(session.messages)));

export const useSmallTalkSessionQuery = (
  sessionId: number,
  { awaitCorrections = false }: SessionQueryOptions = {},
) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const queryClient = useQueryClient();
  const queryKey = smallTalkKeys.session(userId, sessionId);

  // 기다린 지 오래됐는가 — 상한을 넘기면 그만 묻는다
  const [waitedTooLong, setWaitedTooLong] = useState(false);
  // 실패를 되살려 본 적이 있는가 — 한 번만 다시 걸고, 그 답이 올 때까지는 아직 실패로 치지 않는다
  const revivalTriedRef = useRef(false);
  const [revivalSettled, setRevivalSettled] = useState(false);

  const { data, error, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: () => getSmallTalkSession(sessionId),
    // 아직 만드는 중이면 1초 뒤 다시 조회한다.
    // 기다리던 것이 다 끝났거나 상한까지 기다렸으면 false를 돌려 멈춘다
    refetchInterval: (query) =>
      isStillPreparing(query.state.data, awaitCorrections) && !waitedTooLong
        ? POLL_MS
        : false,
  });

  // 상한 타이머는 표현·교정을 한 번에 잰다 — 단계별로 쪼개면 최악의 경우 두 배를 붙잡아 둔다
  const preparing = isStillPreparing(data, awaitCorrections);
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

  // 이미 받아 둔 대화가 있으면 실패를 화면에 올리지 않는다 — 폴링 한 번 끊겼다고 읽던 대화가 사라지면 안 된다.
  // 받아 둔 게 없어도 다시 받아오는 중이면 기다리는 화면을 보여준다
  const settledError = data || isFetching ? null : error;

  return {
    session: data ?? null,
    error: settledError,
    isLoading: !data && settledError === null,
    // 더 기다려도 소용없는 상태 — 다시 걸어 봐도 실패했거나, 상한까지 기다렸는데도 표현이 안 끝났거나.
    // 붙잡아 두지 않고 "나중에 만들어 둘게요"로 보낸다 — 만들어지면 기록에 남는다.
    // 표현은 준비됐는데 교정만 늦은 경우는 여기 안 든다 — 표현을 이미 편 화면을 뒤집을 이유가 없다
    generationStuck:
      (waitedTooLong && data?.expressionGenerationStatus === 'PREPARING') ||
      (failed && revivalSettled),
    // 상한까지 기다려 그만 묻는 상태 — 아직 PREPARING인 것은 이 화면에선 더 안 온다.
    // 교정을 기다리던 화면이 "찾는 중" 표시를 거둘 때 본다 (다시 들어오면 처음부터 다시 묻는다)
    waitExpired: waitedTooLong,
    retry: () => void refetch(),
    // 다시 만들기 — 서버는 접수만 하고 뒤에서 만든다. 상태를 다시 받아 폴링을 잇는다.
    // 대화 직후 화면은 알아서 한 번 걸어 보므로, 이 버튼은 기록에서 다시 시도할 때 쓴다
    regenerate: async () => {
      await retrySmallTalkExpressions(sessionId);
      await queryClient.invalidateQueries({ queryKey });
    },
  };
};
