// iOS 위젯 타임라인 엔트리 조립 — 예약 시각마다 위젯이 받을 props를 만든다
import type { WidgetData } from '@landit/bridge';

import type { ShellLocale } from '../../i18n/shell-locale';
import { artFilePrefixOf } from '../art/widget-art-locale';
import { buildWeekStrip } from '../model/week-strip';
import { buildWidgetTimeline } from './timeline';

export interface TimelineEntry {
  date: Date;
  props: Record<string, unknown>;
}

export const buildTimelineEntries = ({
  locale,
  data,
  now,
  artDir,
}: {
  // 요일 이름·아트의 언어 — 셸 언어(웹 화면 언어)
  locale: ShellLocale;
  data: WidgetData;
  now: Date;
  artDir: string | null;
}): TimelineEntry[] =>
  buildWidgetTimeline({ data, now }).map(({ date, state }) => {
    // 엔트리마다 그 시각 기준으로 다시 계산한다 — 날이 바뀐 엔트리는 주간 창이 밀린다
    const week = buildWeekStrip({
      locale,
      weeklyDone: data.weeklyDone,
      capturedOn: data.capturedOn,
      now: date,
    });
    return {
      date,
      // 네이티브 props 변환([String: Any])이 null을 거부한다 — 값이 없는 필드는 키 자체를 뺀다
      props: {
        kind: state.kind,
        displayStreak: state.displayStreak,
        weekLabels: week.labels,
        weekDone: week.done,
        artPrefix: artFilePrefixOf(locale),
        ...(state.milestone !== null && { milestone: state.milestone }),
        ...(artDir !== null && { artDir }),
      },
    };
  });
