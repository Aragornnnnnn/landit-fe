// 위젯 타임라인 계획 — 스냅샷과 현재 시각으로 향후 전환 시각마다 보여줄 상태 목록을 만든다
import type { WidgetData } from '@landit/bridge';

import { decideWidgetState, type WidgetState } from './widget-state';

export interface WidgetTimelinePlan {
  date: Date;
  state: WidgetState;
}

// 상태가 바뀌는 서울 기준 시각들 — widget-state의 시간표·자정 경계와 짝을 이룬다
const BOUNDARIES = [
  '00:00',
  '12:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '23:00',
  '23:30',
] as const;

// 오늘 포함 3일치만 예약 — 그 뒤는 앱이 다시 열릴 때 갱신된다
const DAYS_AHEAD = 3;

const DAY_MS = 24 * 60 * 60 * 1000;
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

const seoulDateString = (at: Date) =>
  new Date(at.getTime() + SEOUL_OFFSET_MS).toISOString().slice(0, 10);

export const buildWidgetTimeline = ({
  data,
  now,
}: {
  data: WidgetData;
  now: Date;
}): WidgetTimelinePlan[] => {
  const dates: Date[] = [now];
  for (let day = 0; day < DAYS_AHEAD; day += 1) {
    const dateString = seoulDateString(new Date(now.getTime() + day * DAY_MS));
    for (const time of BOUNDARIES) {
      const boundary = new Date(`${dateString}T${time}:00+09:00`);
      if (boundary > now) dates.push(boundary);
    }
  }
  dates.sort((a, b) => a.getTime() - b.getTime());

  return dates.map((date) => ({
    date,
    state: decideWidgetState({ data, now: date }),
  }));
};
