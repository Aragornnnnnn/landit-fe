// 세션 수준 평가 조회 — BE가 비동기로 매기는 동안 2초마다 다시 묻고, 끝나면 멈춘다
import { useQuery } from '@tanstack/react-query';

import {
  getLevelAssessment,
  type LevelAssessmentProcessingStatus,
} from '../api/level-assessment';

const POLL_MS = 2_000;
// 예약 전(NOT_REQUESTED)은 몇 번만 묻고 멈춘다 — BE가 평가를 잡지 않은 세션은 영영 안 온다. 그 뒤는 화면의 상한이 끝낸다
const NOT_REQUESTED_GRACE_POLLS = 3;

/** pending: 기다리는 중 / ready: 결과 도착 / unavailable: 실패·조회 실패라 결과 없이 진행한다 */
export type LevelAssessmentOutcome = 'pending' | 'ready' | 'unavailable';

const resolveOutcome = (
  status: LevelAssessmentProcessingStatus | undefined,
  failed: boolean,
): LevelAssessmentOutcome => {
  if (failed || status === 'FAILED') return 'unavailable';
  if (status === 'COMPLETED') return 'ready';
  return 'pending';
};

/**
 * 세션 수준 평가를 기다린다.
 *
 * @returns `outcome`이 ready일 때만 `levelAssessment`가 의미 있다. 기다림의 상한은 화면이 따로 둔다
 */
export const useLevelAssessmentQuery = (sessionId: number | null) => {
  const { data, isError } = useQuery({
    queryKey: ['level-assessment', sessionId],
    queryFn: () => getLevelAssessment(sessionId as number),
    enabled: sessionId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.processingStatus;
      if (status === 'PREPARING') return POLL_MS;
      if (
        status === 'NOT_REQUESTED' &&
        query.state.dataUpdateCount < NOT_REQUESTED_GRACE_POLLS
      ) {
        return POLL_MS;
      }
      return false;
    },
    retry: 1,
  });

  return {
    outcome: resolveOutcome(data?.processingStatus, isError),
    levelAssessment: data?.levelAssessment ?? null,
  };
};
