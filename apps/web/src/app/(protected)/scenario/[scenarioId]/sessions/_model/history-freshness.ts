// 기록을 언제 다시 받을지 — 끝난 회차는 바뀌지 않지만, 막 끝나 피드백이 만들어지는 중인 회차는 곧 채워진다
import type { ScenarioHistoryResponse } from '../_api/scenario-history';

// 이만큼 지나도 피드백이 없으면 앞으로도 안 생긴다고 본다 — 피드백 생성은 대개 수 초 안에 끝난다
const PENDING_FEEDBACK_WINDOW_MS = 10 * 60 * 1000;

// 서버는 시간대 없는 서울 시각(LocalDateTime)을 준다 — 기기 시간대와 상관없이 서울 시각으로 읽는다
const endedAtMs = (endedAt: string) => Date.parse(`${endedAt}+09:00`);

export const historyStaleTime = (
  data: ScenarioHistoryResponse | undefined,
  now = Date.now(),
) => {
  if (!data) return 0;
  const awaitingFeedback = data.sessions.some(
    (session) =>
      session.feedback === null &&
      now - endedAtMs(session.endedAt) < PENDING_FEEDBACK_WINDOW_MS,
  );
  return awaitingFeedback ? 0 : Infinity;
};
