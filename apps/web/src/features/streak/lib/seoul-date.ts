// Asia/Seoul 기준 날짜 도구 — 날짜는 늘 yyyy-MM-dd 문자열로 다루고,
// 계산할 때만 UTC 자정 Date로 잠깐 바꿨다 되돌린다
//
// 하루의 경계는 전부 서버가 정한다(응답의 today). 여기에 기기 시계를 읽는 함수는 없다

export interface YearMonth {
  year: number;
  month: number;
}

// Date → 날짜 문자열. 이 변환은 여기서만 한다 (UTC 자정으로 만든 Date라야 하루가 안 밀린다)
export const toDateString = (value: Date) => value.toISOString().slice(0, 10);

export const monthOf = (date: string): YearMonth => ({
  year: Number(date.slice(0, 4)),
  month: Number(date.slice(5, 7)),
});

export const formatMonthLabel = ({ year, month }: YearMonth) =>
  `${year}년 ${month}월`;
