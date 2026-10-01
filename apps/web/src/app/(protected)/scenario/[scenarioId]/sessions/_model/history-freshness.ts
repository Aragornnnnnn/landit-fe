// 기록을 언제 다시 받을지 — 끝난 회차는 바뀌지 않지만, 피드백이 아직 없는 회차는 곧 채워질 수 있다
import type { ScenarioHistoryResponse } from '../_api/scenario-history';

/**
 * 모든 회차에 피드백이 있으면 다시 받지 않는다(회차마다 대화 전부가 실려 무겁다).
 * 대화를 막 마치고 들어와 피드백이 만들어지는 중인 회차가 있으면 볼 때마다 다시 받는다
 */
export const historyStaleTime = (data: ScenarioHistoryResponse | undefined) =>
  data && data.sessions.every((session) => session.feedback !== null)
    ? Infinity
    : 0;
