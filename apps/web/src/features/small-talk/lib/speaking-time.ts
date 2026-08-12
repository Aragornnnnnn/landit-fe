// 발화 시간 표기 — 서버가 주는 밀리초를 "2분 41초"처럼 읽히는 문장으로 바꾼다
const SECOND_MS = 1000;
const MINUTE_SECONDS = 60;

export const toSpeakingTimeLabel = (ms: number): string => {
  // 초 미만은 버린다 — 올리면 한도를 넘겨 보이고, 초과분(음수)은 0으로 막는다
  const totalSeconds = Math.max(0, Math.floor(ms / SECOND_MS));
  const minutes = Math.floor(totalSeconds / MINUTE_SECONDS);
  const seconds = totalSeconds % MINUTE_SECONDS;

  if (minutes === 0) return `${seconds}초`;
  // 딱 떨어지는 분에 "0초"를 붙이지 않는다
  return seconds === 0 ? `${minutes}분` : `${minutes}분 ${seconds}초`;
};

// 대화 중 줄어드는 시간 표기 — 초 단위로 깎이는 값이라 문장("41초") 대신 시계(0:41)로 읽힌다
export const toCountdownLabel = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / SECOND_MS));
  const minutes = Math.floor(totalSeconds / MINUTE_SECONDS);
  const seconds = totalSeconds % MINUTE_SECONDS;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};
