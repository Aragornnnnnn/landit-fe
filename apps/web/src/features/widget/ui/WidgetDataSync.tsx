// 홈 위젯 데이터를 셸로 동기화한다 — 루트 레이아웃에 마운트, WebView 밖에서는 조용히 무시된다
'use client';

import { useEffect } from 'react';
import { EMPTY_WIDGET_DATA } from '@landit/bridge';

// 위젯 데이터는 스트릭·시나리오 데이터를 합쳐야 만들어져서 가로 참조가 불가피하다
import { useDailyScenarioQuery } from '@/features/scenario/model/useDailyScenarioQuery';
import { shiftMonth } from '@/features/streak/lib/month-grid';
import { useStreakCalendarQuery } from '@/features/streak/model/useStreakCalendarQuery';
import { useStreakQuery } from '@/features/streak/model/useStreakQuery';
import { useAuthStore } from '@/shared/auth/auth-store';
import { postToNative } from '@/shared/bridge/web-bridge';

import { buildWidgetData } from '../model/build-widget-data';

export const WidgetDataSync = () => {
  const isLoggedIn = useAuthStore((state) => state.member !== null);
  const { streak } = useStreakQuery();
  const { daily } = useDailyScenarioQuery();
  // 이번 달 활동 날짜 전체 — 주간 창을 채우고, 오래 쉰 유저의 마지막 완료일을 넓게 찾는다.
  // 완료 직후 프리페치된 캐시를 재사용해 보통은 네트워크를 타지 않는다
  const { calendar: thisMonth } = useStreakCalendarQuery({
    enabled: isLoggedIn,
  });
  // 지난달까지 봐야 한 달 가까이 쉰 사람도 며칠째인지 정확히 알 수 있다.
  // 이번 달 응답이 와야 지난달이 몇 월인지 알 수 있어 순서대로 받는다
  const { calendar: lastMonth } = useStreakCalendarQuery({
    enabled: isLoggedIn && thisMonth !== null,
    view:
      thisMonth === null
        ? null
        : shiftMonth({ year: thisMonth.year, month: thisMonth.month }, -1),
  });

  // 이번 렌더에 셸로 보낼 직렬화 데이터 — null이면 보내지 않는다.
  // 로그아웃은 빈 값을 보내야 하고(안 보내면 셸에 이전 사용자 기록이 남는다),
  // 로딩 중엔 보내면 안 된다(빈 값을 보내면 위젯이 0일로 깜빡인다).
  // 객체 대신 직렬화 문자열을 effect 키로 써서 값이 실제로 바뀔 때만 다시 보낸다
  const serializePayload = () => {
    if (!isLoggedIn) return JSON.stringify(EMPTY_WIDGET_DATA);
    if (streak === null) return null;
    return JSON.stringify(
      buildWidgetData(streak, daily, [thisMonth, lastMonth]),
    );
  };
  const payload = serializePayload();

  useEffect(() => {
    if (payload === null) return;
    postToNative({ type: 'SYNC_WIDGET_DATA', data: JSON.parse(payload) });
  }, [payload]);

  return null;
};
