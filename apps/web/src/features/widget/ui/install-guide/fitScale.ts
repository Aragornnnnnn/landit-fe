// 안내 목업을 남는 높이에 맞출 축소 비율 — 키우지는 않고, 높이를 못 쟀으면 원래 크기로 둔다
export const fitScale = (available: number, natural: number): number =>
  available > 0 ? Math.min(1, available / natural) : 1;
