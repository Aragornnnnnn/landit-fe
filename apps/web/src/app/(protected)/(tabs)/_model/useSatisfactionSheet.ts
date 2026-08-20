// 홈 탭에 돌아왔을 때 띄울 소감 시트를 하나만 고른다 — 그 탭의 첫 소감 → 리뷰 요청 순.
// 방금 겪은 일이라 소감이 먼저고, 리뷰는 다음 방문에 청해도 된다.
// 판단은 마운트 때(리뷰는 달력 응답 때) 한 번 고정한다 — 시트가 닫히자마자 다음 시트가 이어 뜨지 않게
import { useState } from 'react';
import type { SatisfactionTalk } from '@landit/analytics';

import {
  mayAskReview,
  shouldAskReview,
  shouldAskSatisfaction,
} from '@/features/satisfaction/model/prompt-record';
import type { StreakCalendarResponse } from '@/features/streak/api/streak';
import { useStreakCalendarQuery } from '@/features/streak/model/useStreakCalendarQuery';

export type SatisfactionSheet = 'talk' | 'review';

interface Decision {
  // null = 아직 고르는 중. 리뷰 조건에 쓸 스트릭 달력을 기다린다
  sheet: SatisfactionSheet | null;
  settled: boolean;
}

export const useSatisfactionSheet = (talk: SatisfactionTalk): Decision => {
  // 서버에선 localStorage가 없어 false — 클라이언트 첫 렌더에서 정해진다
  const [asksTalk] = useState(() => shouldAskSatisfaction(talk));
  // 로컬만으로 걸러지면 스트릭을 부르지 않는다
  const [mayReview] = useState(mayAskReview);
  const { calendar, isError } = useStreakCalendarQuery({
    enabled: !asksTalk && mayReview,
  });

  // 달력이 오면 그 응답에 대해 한 번만 판단해 붙잡아 둔다 — 렌더 중 상태 조정,
  // 시트가 뜨며 차례가 소비돼도 판단이 뒤집히지 않게
  const [decided, setDecided] = useState<{
    calendar: StreakCalendarResponse;
    asks: boolean;
  } | null>(null);
  if (calendar && decided?.calendar !== calendar)
    setDecided({ calendar, asks: shouldAskReview(calendar) });

  if (asksTalk) return { sheet: 'talk', settled: true };
  if (!mayReview || isError) return { sheet: null, settled: true };
  if (!decided) return { sheet: null, settled: false };
  return { sheet: decided.asks ? 'review' : null, settled: true };
};
