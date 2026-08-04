// 달력 칸 하나가 무엇을 뜻하는지 정하는 규칙 — 도장을 찍을지, 놓친 날인지, 띠를 어디로 뻗을지
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

// 이어진 구간의 띠 — 한 주 행에서 붙어 있는 'done' 칸을 한 덩어리로 묶는다.
// 칸 상태를 그대로 받는다. 날짜와 활동 목록을 다시 받으면 "깬 날"의 정의가 markOf와 갈라질 수 있다.
// 7열 격자에서 띠는 행을 넘지 못하고, 하루짜리도 구간이다 — 붙어 있으면 하나로 합쳐 보이게 한다
export const runsOf = (marks: DayMark[]): DayRun[] => {
  const runs: DayRun[] = [];

  marks.forEach((mark, index) => {
    if (mark !== 'done') return;

    const previous = runs[runs.length - 1];
    if (previous && previous.start + previous.length === index) {
      previous.length += 1;
      return;
    }
    runs.push({ start: index, length: 1 });
  });

  return runs;
};
