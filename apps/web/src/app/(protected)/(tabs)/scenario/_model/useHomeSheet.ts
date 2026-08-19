// 홈(시나리오 탭) 복귀 때 띄울 시트를 하나만 고른다 — 첫 소감 → 랜딧 소감(스트릭 조건) → 알림 동의.
// 대화를 마치고 돌아왔으면 이번 방문엔 소감만 묻는다 — 방금 겪은 일이라 미루면 의미가 없고, 알림 동의는 다음 방문에 물어도 된다.
// 판단은 마운트 때(랜딧 소감은 달력 응답 때) 한 번 고정한다 — 시트가 닫히자마자 다음 시트가 이어 뜨지 않게
import { useState } from 'react';

import {
  mayAskAppSatisfaction,
  shouldAskAppSatisfaction,
  shouldAskSatisfaction,
} from '@/features/satisfaction/model/prompt-record';
import { useStreakCalendarQuery } from '@/features/streak/model/useStreakCalendarQuery';

export type HomeSheet = 'first-satisfaction' | 'app-satisfaction' | 'consent';

// null = 아직 고르는 중 (랜딧 소감 조건에 쓸 달력을 기다린다)
export const useHomeSheet = (): HomeSheet | null => {
  // 서버에선 localStorage가 없어 false — 클라이언트 첫 렌더에서 정해진다
  const [asksFirst] = useState(() => shouldAskSatisfaction('scenario'));
  // 로컬만으로 걸러지면 스트릭을 부르지 않는다
  const [mayAskApp] = useState(mayAskAppSatisfaction);
  const { calendar, isError } = useStreakCalendarQuery({
    enabled: !asksFirst && mayAskApp,
  });

  // 달력이 오면 그 응답에 대해 한 번만 판단해 붙잡아 둔다 — 렌더 중 상태 조정, 받은 응답이 바뀔 때만 다시 본다
  const [appDecision, setAppDecision] = useState<{
    calendar: typeof calendar;
    asks: boolean;
  } | null>(null);
  if (calendar && appDecision?.calendar !== calendar)
    setAppDecision({ calendar, asks: shouldAskAppSatisfaction(calendar) });

  if (asksFirst) return 'first-satisfaction';
  if (!mayAskApp || isError) return 'consent';
  if (!appDecision) return null;
  return appDecision.asks ? 'app-satisfaction' : 'consent';
};
