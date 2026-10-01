// 서버 날짜를 「7월 8일」로 — 스몰톡 기록과 성장 카드가 같이 쓴다

// 서버가 주는 LocalDateTime(2026-07-28T21:03:11)에는 시간대가 없다.
// Date로 파싱하면 브라우저가 UTC로 읽어 하루가 밀 수 있어 앞의 날짜만 잘라 쓴다
export const toDayLabel = (isoDateTime: string): string => {
  const [, month, day] = isoDateTime.slice(0, 10).split('-');
  return `${Number(month)}월 ${Number(day)}일`;
};
