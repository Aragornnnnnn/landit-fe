// 서울 기준 시각 계산 — 위젯의 하루 경계는 전부 이 기준을 쓴다.
// 앱의 다른 날짜는 서버 기준이 원칙이지만, 위젯은 서버를 부를 수 없어 여기서만 서울로 고정한다.
// 한 곳에 모아두지 않으면 오프셋을 옮겨 적다 어긋난다
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

const shifted = (at: Date) => new Date(at.getTime() + SEOUL_OFFSET_MS);

/** yyyy-MM-dd */
export const seoulDate = (at: Date): string =>
  shifted(at).toISOString().slice(0, 10);

/** 0(일) ~ 6(토) */
export const seoulWeekday = (at: Date): number => shifted(at).getUTCDay();

export const seoulClock = (at: Date) => {
  const seoul = shifted(at);
  return {
    date: seoulDate(at),
    hour: seoul.getUTCHours(),
    minute: seoul.getUTCMinutes(),
  };
};
