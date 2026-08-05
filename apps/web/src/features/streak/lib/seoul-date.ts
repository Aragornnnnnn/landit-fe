// Asia/Seoul 기준 날짜 도구 — 날짜는 늘 yyyy-MM-dd 문자열로 다루고,
// 계산할 때만 UTC 자정 Date로 잠깐 바꿨다 되돌린다
//
// 하루의 경계는 서버가 정한다(응답의 today). todayInSeoul은 "어느 달을 먼저 물을지"를
// 고르는 데만 쓴다 — 응답을 받기 전에는 물을 달을 알아야 해서 기기 값이 필요하다

export interface YearMonth {
  year: number;
  month: number;
}

// format()은 로케일 표시용 문자열이라 구현에 따라 구분자·순서가 달라질 수 있다.
// 연·월·일 부품을 받아 직접 조립해야 yyyy-MM-dd가 계약으로 보장된다
const SEOUL_PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// 응답을 받기 전 한 번만 쓰는 값 — 화면 판단에는 서버가 준 today를 쓴다
export const todayInSeoul = () => {
  const parts = SEOUL_PARTS.formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${value('year')}-${value('month')}-${value('day')}`;
};

// Date → 날짜 문자열. 이 변환은 여기서만 한다 (UTC 자정으로 만든 Date라야 하루가 안 밀린다)
export const toDateString = (value: Date) => value.toISOString().slice(0, 10);

export const monthOf = (date: string): YearMonth => ({
  year: Number(date.slice(0, 4)),
  month: Number(date.slice(5, 7)),
});

export const formatMonthLabel = ({ year, month }: YearMonth) =>
  `${year}년 ${month}월`;
