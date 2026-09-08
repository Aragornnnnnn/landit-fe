// 세션 수준 평가 조회 — BE가 비동기로 매기는 동안(PREPARING) 2초마다 다시 묻고, 끝나면 멈춘다
import { useQuery } from '@tanstack/react-query';

import { getLevelAssessment } from '../api/level-assessment';

export const levelAssessmentKey = (sessionId: number | null) =>
  ['level-assessment', sessionId] as const;

const POLL_MS = 2_000;

export const useLevelAssessmentQuery = (
  sessionId: number | null,
  { enabled = true }: { enabled?: boolean } = {},
) => {
  const { data, isError } = useQuery({
    queryKey: levelAssessmentKey(sessionId),
    queryFn: () => getLevelAssessment(sessionId as number),
    enabled: enabled && sessionId !== null,
    // 예약 전(NOT_REQUESTED)·진행 중(PREPARING)이면 계속 묻는다. 상한은 화면이 정한다
    refetchInterval: (query) => {
      const status = query.state.data?.processingStatus;
      return status === 'PREPARING' || status === 'NOT_REQUESTED'
        ? POLL_MS
        : false;
    },
    retry: 1,
  });

  return { assessment: data ?? null, isError };
};
