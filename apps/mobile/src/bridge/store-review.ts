// 브릿지 REQUEST_REVIEW를 앱 안 별점 카드로 잇는다 — 카드를 기다리는 사이 겹친 요청은 같은 결과를 받는다
import type { ReviewResultStatus } from '@landit/bridge';

import { requestReviewPrompt } from '../../modules/review-prompt';

// 웹은 보내자마자 잠금을 풀 수 없다 — 카드가 떠 있는지는 셸만 안다
let inFlight: Promise<ReviewResultStatus> | null = null;

export const requestStoreReview = (): Promise<ReviewResultStatus> => {
  if (inFlight) return inFlight;
  inFlight = requestReviewPrompt()
    // 모듈이 실패하면 카드가 없는 것과 같다 — 웹이 지금처럼 스토어로 보낸다
    .catch((): ReviewResultStatus => 'unavailable')
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
};
