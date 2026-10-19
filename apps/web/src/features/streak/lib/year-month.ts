// 스트릭 달력의 연·월 도구 — 날짜 계산 자체는 shared/lib/date-string이 맡는다

export interface YearMonth {
  year: number;
  month: number;
}

export const monthOf = (date: string): YearMonth => ({
  year: Number(date.slice(0, 4)),
  month: Number(date.slice(5, 7)),
});

export const formatMonthLabel = ({ year, month }: YearMonth) =>
  `${year}년 ${month}월`;
