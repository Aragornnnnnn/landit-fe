// 지난 스몰톡 한 줄을 이루는 값들 — 언제 했고, 얼마나 얘기했고, 표현을 얼마나 배웠는지

// 서버가 주는 LocalDateTime(2026-07-28T21:03:11)에는 시간대가 없다.
// Date로 파싱하면 브라우저가 UTC로 읽어 하루가 밀 수 있어 앞의 날짜만 잘라 쓴다
export const toDayLabel = (isoDateTime: string): string => {
  const [, month, day] = isoDateTime.slice(0, 10).split('-');
  return `${Number(month)}월 ${Number(day)}일`;
};

// 제목은 서버가 대화 내용에서 뽑는다. 못 뽑았으면 날짜가 그 자리를 대신한다
export const toSessionTitle = (
  title: string | null,
  completedAt: string,
): string => title ?? `${toDayLabel(completedAt)}의 대화`;
