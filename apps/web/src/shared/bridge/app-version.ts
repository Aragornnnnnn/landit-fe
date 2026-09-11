// 셸이 주입한 앱 버전 문자열(x.y.z) 비교 — 어떤 기능이 실린 릴리즈인지 가르는 데 쓴다.
// 문자열 비교는 1.10.0 < 1.3.0이 돼서 자리별 정수로 잰다
const parseVersionParts = (version: string): number[] | null => {
  const parts = version.trim().split('.');
  if (parts.some((part) => !/^\d+$/.test(part))) return null;
  return parts.map(Number);
};

/**
 * 앱 버전이 최소 버전 이상인지 본다.
 *
 * 자리가 모자라면 0으로 채운다(1.3 = 1.3.0). 읽을 수 없는 버전은 낮은 것으로 본다 — 모르는 셸에 기능을 열지 않는다.
 */
export const isAppVersionAtLeast = (version: string, minimum: string) => {
  const actual = parseVersionParts(version);
  const floor = parseVersionParts(minimum);
  if (!actual || !floor) return false;

  const length = Math.max(actual.length, floor.length);
  for (let i = 0; i < length; i += 1) {
    const a = actual[i] ?? 0;
    const b = floor[i] ?? 0;
    if (a !== b) return a > b;
  }
  return true;
};
