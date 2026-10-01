// 남은 시간 표기 — 할인 시트와 헤더 배지가 같은 모양을 쓴다
const SECONDS_PER_MINUTE = 60;

/**
 * 남은 초를 분:초로 적는다.
 *
 * @param seconds 남은 초. 음수는 0으로 본다
 * @returns "02:45" 꼴. 한 자리 수도 0을 채워 글자 폭이 흔들리지 않게 한다
 */
export const formatPromoClock = (seconds: number) => {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / SECONDS_PER_MINUTE);
  const rest = safe % SECONDS_PER_MINUTE;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
};
