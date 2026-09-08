// 앱 버전 문자열(x.y.z) 비교 — 셸이 주입한 appVersion이 결제를 아는 릴리즈인지 판단하는 데 쓴다
const toParts = (version: string): number[] | null => {
  const parts = version.trim().split('.');
  if (parts.length === 0 || parts.some((part) => !/^\d+$/.test(part))) {
    return null;
  }
  return parts.map(Number);
};

export const isAppVersionAtLeast = (version: string, minimum: string) => {
  const actual = toParts(version);
  const floor = toParts(minimum);
  // 읽을 수 없는 버전은 낮은 것으로 — 모르는 셸에 결제를 열지 않는다
  if (!actual || !floor) return false;

  const length = Math.max(actual.length, floor.length);
  for (let i = 0; i < length; i += 1) {
    const a = actual[i] ?? 0;
    const b = floor[i] ?? 0;
    if (a !== b) return a > b;
  }
  return true;
};
