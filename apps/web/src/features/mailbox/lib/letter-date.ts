// 편지 날짜 표기 — 서버가 주는 ISO 시각을 서울 기준으로 읽어 화면 문구로 바꾼다
// 기기 시계의 시간대를 따르면 해외에서 하루가 밀려 보인다. 시간대를 여기서 못 박는다

// 시간대만 Intl에 맡기고 문구는 직접 조립한다 — 로케일 데이터가 얇은 런타임에서
// ko-KR이 오전/오후 대신 AM/PM을 내주는 걸 봤다. 표기까지 환경에 맡기지 않는다
const seoulParts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
});

const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/;

// 오프셋이 없는 시각은 서버가 서울 벽시계로 적어 보낸 것으로 읽는다.
// 백엔드가 LocalDateTime으로 내리면 `2026-08-09T11:30:00`처럼 오프셋이 빠지는데,
// 그대로 Date에 넘기면 기기 시간대로 해석돼 해외에서 하루가 밀린다
const toInstant = (sentAt: string) =>
  new Date(HAS_OFFSET.test(sentAt) ? sentAt : `${sentAt}+09:00`);

// 읽을 수 없는 시각이면 null. 던지면 그 편지 한 줄 때문에 목록 전체가 에러 화면으로 간다 —
// 계약이 아직 백엔드와 맞춰지지 않아 빈 값·날짜만 있는 값이 올 수 있다
const readSeoulDate = (sentAt: string) => {
  const instant = toInstant(sentAt);
  if (Number.isNaN(instant.getTime())) return null;

  const parts = {} as Record<Intl.DateTimeFormatPartTypes, string>;
  for (const { type, value } of seoulParts.formatToParts(instant)) {
    parts[type] = value;
  }
  return parts;
};

// 리스트용 — `26.08.09`. 좁은 한 줄에 연도까지 넣어야 해서 두 자리로 줄인다
export const formatLetterDate = (sentAt: string) => {
  const parts = readSeoulDate(sentAt);
  if (!parts) return '';

  return `${parts.year}.${parts.month}.${parts.day}`;
};
