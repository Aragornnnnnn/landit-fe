// 홈 탭에 돌아왔을 때 띄울 소감 시트를 하나만 고른다 — 그 탭의 첫 소감 → 리뷰 요청 순.
// 방금 겪은 일이라 소감이 먼저고, 리뷰는 다음 완료 때 청해도 된다.
// 판단은 마운트 때 한 번 고정한다 — 시트가 뜨며 차례가 소비돼도 판단이 뒤집히지 않게
import { useState } from 'react';
import type { SatisfactionTalk } from '@landit/analytics';

import {
  shouldAskReview,
  shouldAskSatisfaction,
} from '@/features/satisfaction/model/prompt-record';

export type SatisfactionSheet = 'talk' | 'review';

export const useSatisfactionSheet = (
  talk: SatisfactionTalk,
): SatisfactionSheet | null => {
  // 서버에선 localStorage가 없어 null — 클라이언트 첫 렌더에서 정해진다
  const [sheet] = useState<SatisfactionSheet | null>(() => {
    if (shouldAskSatisfaction(talk)) return 'talk';
    if (shouldAskReview()) return 'review';
    return null;
  });
  return sheet;
};
