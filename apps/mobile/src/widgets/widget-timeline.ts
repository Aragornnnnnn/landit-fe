// 위젯 타임라인 계획 — 위젯 데이터와 현재 시각으로 향후 전환 시각마다 보여줄 상태 목록을 만든다
import type { WidgetData } from '@landit/bridge';

import { seoulDate } from './seoul-date';
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

// 오늘 포함 31일치를 예약한다 — 마지막 몰락 단계(완료 30일 뒤 소등)까지 닿는 길이다.
// 앱을 안 열면 예약이 바닥난 자리에 화면이 멈추므로, 안 여는 사람일수록 창이 길어야 한다
const DAYS_AHEAD = 31;

const DAY_MS = 24 * 60 * 60 * 1000;

export const buildWidgetTimeline = ({
  data,
  now,
}: {
  data: WidgetData;
  now: Date;
}): WidgetTimelinePlan[] => {
  const dates: Date[] = [now];
  for (let day = 0; day < DAYS_AHEAD; day += 1) {
    const dateString = seoulDate(new Date(now.getTime() + day * DAY_MS));
    for (const time of BOUNDARIES) {
      const boundary = new Date(`${dateString}T${time}:00+09:00`);
      if (boundary > now) dates.push(boundary);
    }
  }
  dates.sort((a, b) => a.getTime() - b.getTime());

  return (
    dates
      .map((date) => ({ date, state: decideWidgetState({ data, now: date }) }))
      // 같은 날 안에서 화면이 같으면 예약하지 않는다 — 몰락 구간은 시각 경계가 전부 중복이다.
      // 날이 바뀌면 화면이 같아도 남긴다 — 주간 스트립 창을 그날로 밀어야 한다
      .filter(
        (plan, index, all) =>
          index === 0 ||
          !sameState(plan.state, all[index - 1].state) ||
          seoulDate(plan.date) !== seoulDate(all[index - 1].date),
      )
  );
};

const sameState = (one: WidgetState, other: WidgetState) =>
  one.kind === other.kind &&
  one.displayStreak === other.displayStreak &&
  one.milestone === other.milestone;
