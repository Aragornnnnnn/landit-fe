// 홈 위젯용 스트릭 스냅샷을 셸로 동기화한다 — 루트 레이아웃에 마운트, WebView 밖에서는 조용히 무시된다
'use client';

import { useEffect } from 'react';

// 위젯 스냅샷은 스트릭·시나리오 데이터를 합쳐야 만들어져서 가로 참조가 불가피하다
import { shiftWindow } from '@/features/scenario/lib/calendar-window';
import { useDailyScenarioQuery } from '@/features/scenario/model/useDailyScenarioQuery';
import { useScenarioCalendarQuery } from '@/features/scenario/model/useScenarioCalendarQuery';
import { useStreakQuery } from '@/features/streak/model/useStreakQuery';
import { postToNative } from '@/shared/bridge/web-bridge';

import { buildWidgetData } from '../model/build-widget-data';

export const WidgetDataSync = () => {
  const { streak } = useStreakQuery();
  const { daily } = useDailyScenarioQuery();
  // 최근 7일이 이번 주·지난주 두 창에 걸치므로 둘 다 받는다
  const { calendar: thisWeek } = useScenarioCalendarQuery('WEEK');
  const lastWeekDate =
    streak === null ? undefined : shiftWindow(streak.today, 'WEEK', -1);
  const { calendar: lastWeek } = useScenarioCalendarQuery(
    'WEEK',
    lastWeekDate,
    lastWeekDate !== undefined,
  );

  // 스냅샷이 실제로 바뀔 때만 다시 보내도록 직렬화 문자열을 effect 키로 쓴다
  const payload =
    streak === null
      ? null
      : JSON.stringify(buildWidgetData(streak, daily, [thisWeek, lastWeek]));

  useEffect(() => {
    if (payload === null) return;
    postToNative({ type: 'SYNC_WIDGET_DATA', data: JSON.parse(payload) });
  }, [payload]);

  return null;
};
