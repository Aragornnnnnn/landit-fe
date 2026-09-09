// 구독 날짜 표기 — BE LocalDateTime(오프셋 없음)을 서울 벽시계로 읽어 "2026년 10월 4일"로 만든다.
// 기기 시간대로 읽으면 해외에서 하루가 밀린다 (편지 날짜 letter-date.ts와 같은 이유)

const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/;

const seoulDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

/** 읽을 수 없는 시각이면 빈 문자열 — 날짜 한 줄 때문에 마이페이지가 죽을 이유가 없다 */
export const formatSubscriptionDate = (dateTime: string): string => {
  const instant = new Date(
    HAS_OFFSET.test(dateTime) ? dateTime : `${dateTime}+09:00`,
  );
  if (Number.isNaN(instant.getTime())) return '';

  const parts = Object.fromEntries(
    seoulDate.formatToParts(instant).map(({ type, value }) => [type, value]),
  );
  return `${parts.year}년 ${parts.month}월 ${parts.day}일`;
};
