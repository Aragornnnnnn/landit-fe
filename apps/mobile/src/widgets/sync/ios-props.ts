// iOS 위젯 타임라인 엔트리 조립 — 예약 시각마다 위젯이 받을 props를 만든다
import type { WidgetData } from '@landit/bridge';

import { buildWeekStrip } from '../week-strip';
import { freshCardTitle } from '../widget-state';
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
}): TimelineEntry[] =>
  buildWidgetTimeline({ data, now }).map(({ date, state }) => {
    // 엔트리마다 그 시각 기준으로 다시 계산한다 — 날이 바뀐 엔트리는 제목이 빠지고 주간 창이 밀린다
    const week = buildWeekStrip({
      weeklyDone: data.weeklyDone,
      capturedOn: data.capturedOn,
      now: date,
    });
    const title = freshCardTitle(data, date);
    return {
      date,
      // 네이티브 props 변환([String: Any])이 null을 거부한다 — 값이 없는 필드는 키 자체를 뺀다
      props: {
        kind: state.kind,
        displayStreak: state.displayStreak,
        weekLabels: week.labels,
        weekDone: week.done,
        ...(state.milestone !== null && { milestone: state.milestone }),
        ...(artDir !== null && { artDir }),
        ...(title !== null && { todayCardTitle: title }),
      },
    };
  });
