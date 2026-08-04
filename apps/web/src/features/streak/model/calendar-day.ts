// 달력 칸 하나가 무엇을 뜻하는지 정하는 규칙 — 도장을 찍을지, 놓친 날인지, 띠를 어디로 뻗을지
import type { MonthWeek } from '../lib/month-grid';

export type DayMark =
  // 그날 학습을 끝냈다 — 열매를 채운 날
  | 'done'
  // 지나갔는데 비어 있다 — 빈 동그라미
  | 'missed'
  // 오늘인데 아직 — 아직 놓친 게 아니다
  | 'today'
  // 그릴 것이 없다 (아직 오지 않았거나, 기록이 시작되기 전)
  | 'blank';

interface DayContext {
  // Asia/Seoul 기준 오늘
  today: string;
  activeDates: Set<string>;
  // 이력 전체의 첫 완료일. 그 앞은 놓친 게 아니라 기록 자체가 없다
  firstRecordDate: string | null;
}

export const markOf = (
  date: string,
  { today, activeDates, firstRecordDate }: DayContext,
): DayMark => {
  if (activeDates.has(date)) return 'done';
  if (date === today) return 'today';
  if (date > today) return 'blank';
  if (firstRecordDate === null || date < firstRecordDate) return 'blank';
  return 'missed';
};

// 띠 하나가 덮는 칸 — 시작 칸 번호와 칸 수
export interface DayRun {
  start: number;
  length: number;
}

// 이어진 구간의 띠 — 같은 주 행에서 붙어 있는 완료일을 한 덩어리로 묶는다.
// 응답이 요청한 월의 날짜만 주므로 월 경계 너머는 알 수 없고, 7열 격자에서 띠는 어차피 행을 넘지 못한다.
// 하루짜리도 구간이다 — 완료한 날마다 알약을 깔고, 붙어 있으면 하나로 합쳐 보이게 한다
export const runsOf = (week: MonthWeek, activeDates: Set<string>): DayRun[] => {
  const runs: DayRun[] = [];

  week.forEach((date, index) => {
    if (date === null || !activeDates.has(date)) return;

    const previous = runs[runs.length - 1];
    if (previous && previous.start + previous.length === index) {
      previous.length += 1;
      return;
    }
    runs.push({ start: index, length: 1 });
  });

  return runs;
};
