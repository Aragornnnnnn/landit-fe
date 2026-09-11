// BE 시각을 서울 벽시계로 읽는다 — 편지 날짜와 구독 날짜가 같은 규칙을 쓴다.
// 백엔드가 LocalDateTime으로 내려 `2026-08-09T11:30:00`처럼 오프셋이 빠진다. 그대로 Date에 넘기면
// 기기 시간대로 해석돼 해외에서 하루가 밀리므로, 오프셋이 없으면 서울(+09:00)로 못 박는다

const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/;

export type SeoulDateParts = Partial<
  Record<Intl.DateTimeFormatPartTypes, string>
>;

/**
 * 시각을 서울 기준 날짜 조각으로 돌려준다. 읽을 수 없는 시각이면 null —
 * 던지면 날짜 한 줄 때문에 화면 전체가 에러로 간다.
 *
 * @param options 조각의 모양(연도 두 자리·시각 포함 등). 시간대는 여기서 서울로 고정한다
 */
export const readSeoulDateParts = (
  dateTime: string,
  options: Intl.DateTimeFormatOptions,
): SeoulDateParts | null => {
  const instant = new Date(
    HAS_OFFSET.test(dateTime) ? dateTime : `${dateTime}+09:00`,
  );
  if (Number.isNaN(instant.getTime())) return null;

  // 시간대만 Intl에 맡기고 문구는 호출부가 조립한다 — 로케일 데이터가 얇은 런타임에서
  // ko-KR이 오전/오후 대신 AM/PM을 내주는 걸 봤다. 표기까지 환경에 맡기지 않는다
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    ...options,
  });
  return Object.fromEntries(
    formatter.formatToParts(instant).map(({ type, value }) => [type, value]),
  );
};
