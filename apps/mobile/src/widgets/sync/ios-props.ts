// iOS 위젯 타임라인 엔트리 조립 — 예약 시각마다 위젯이 받을 props를 만든다
import type { WidgetData } from '@landit/bridge';

import { buildWeekStrip } from '../week-strip';
import { buildWidgetTimeline } from '../widget-timeline';

export interface TimelineEntry {
  date: Date;
  props: Record<string, unknown>;
}

export const buildTimelineEntries = ({
  data,
  now,
  artDir,
}: {
  data: WidgetData;
  now: Date;
  artDir: string | null;
}): TimelineEntry[] => {
  // 주간 스트립의 7일 창은 위젯 데이터 기준(오늘로 끝남)이라 라벨도 지금 시각으로 한 번만 계산한다
  const week = buildWeekStrip({ weeklyDone: data.weeklyDone, now });

  return buildWidgetTimeline({ data, now }).map(({ date, state }) => ({
    date,
    // 네이티브 props 변환([String: Any])이 null을 거부한다 — 값이 없는 필드는 키 자체를 뺀다
    props: {
      kind: state.kind,
      displayStreak: state.displayStreak,
      weekLabels: week.labels,
      weekDone: week.done,
      ...(state.milestone !== null && { milestone: state.milestone }),
      ...(artDir !== null && { artDir }),
      ...(data.todayCardTitle !== null && {
        todayCardTitle: data.todayCardTitle,
      }),
    },
  }));
};
