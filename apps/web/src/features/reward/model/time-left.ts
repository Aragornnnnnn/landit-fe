// 오늘이 끝나기까지 남은 시간 — 환급은 한국 시각 자정에 하루를 마감한다
const DAY_MS = 24 * 60 * 60 * 1000;
export const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export const msUntilKstMidnight = (now: number) =>
  DAY_MS - ((now + KST_OFFSET_MS) % DAY_MS);

// 하루가 이만큼 남았을 때부터 시계를 띄운다 — 그 전에는 같은 말을 차분하게만 한다
const URGENT_WINDOW_MS = 6 * 60 * 60 * 1000;

export const isUrgent = (msLeft: number) => msLeft <= URGENT_WINDOW_MS;

// 급함이 바뀌기까지 남은 시간 — 낮에는 급해지는 순간(자정 여섯 시간 전)까지, 급할 때는 풀리는 자정까지
export const msUntilUrgentChange = (msLeft: number) =>
  isUrgent(msLeft) ? msLeft : msLeft - URGENT_WINDOW_MS;

// 초까지 줄어드는 시계 글자 (08:50:12) — 자릿수를 고정해 숫자가 바뀌어도 폭이 흔들리지 않는다
export const clockLabel = (ms: number) => {
  const total = Math.max(Math.ceil(ms / 1000), 0);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
};

// 기기 시간대가 한국 시각과 다른지 — getTimezoneOffset은 UTC에서 기기 시각을 뺀 분이라 한국이면 -540이다
export const isOutsideKoreaTime = (
  clock: Pick<Date, 'getTimezoneOffset'> = new Date(),
) => clock.getTimezoneOffset() !== -KST_OFFSET_MS / 60_000;
