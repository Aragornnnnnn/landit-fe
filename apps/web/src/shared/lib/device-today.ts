// 기기의 오늘 — 기기 현지 날짜 YYYY-MM-DD. 서버 날짜가 아니라 기기 시계 기준이다
const pad = (value: number) => String(value).padStart(2, '0');

export const getDeviceToday = (now = new Date()) =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
