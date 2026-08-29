// 주간 스트립 데이터 — 스냅샷의 7일 완료 배열(오늘로 끝남)에 서울 기준 요일 라벨을 붙인다
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

const seoulDayIndex = (at: Date) =>
  new Date(at.getTime() + SEOUL_OFFSET_MS).getUTCDay();

export const buildWeekStrip = ({
  weeklyDone,
  now,
}: {
  weeklyDone: boolean[];
  now: Date;
}): { labels: string[]; done: boolean[] } => {
  const today = seoulDayIndex(now);
  // 오늘로 끝나는 7일 창의 첫 칸은 6일 전 = 요일로는 내일과 같다
  const labels = Array.from(
    { length: 7 },
    (_, i) => DAY_NAMES[(today + 1 + i) % 7],
  );
  return { labels, done: [...weeklyDone] };
};
