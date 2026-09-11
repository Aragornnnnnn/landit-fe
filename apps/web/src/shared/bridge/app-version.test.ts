// 앱 버전 비교 — 어떤 기능이 실린 릴리즈인지 가르는 계약. 문자열 비교로는 1.10.0 < 1.3.0이 돼서 정수로 잰다
import { describe, expect, it } from 'vitest';

import { isAppVersionAtLeast } from './app-version';

describe('isAppVersionAtLeast', () => {
  it('같거나 높은 버전이면 참이다', () => {
    expect(isAppVersionAtLeast('1.3.0', '1.3.0')).toBe(true);
    expect(isAppVersionAtLeast('1.3.1', '1.3.0')).toBe(true);
    expect(isAppVersionAtLeast('2.0.0', '1.3.0')).toBe(true);
  });

  it('낮은 버전이면 거짓이다', () => {
    expect(isAppVersionAtLeast('1.2.9', '1.3.0')).toBe(false);
    expect(isAppVersionAtLeast('0.9.0', '1.3.0')).toBe(false);
  });

  it('자리별 정수로 비교한다 — 1.10.0은 1.3.0보다 높다', () => {
    expect(isAppVersionAtLeast('1.10.0', '1.3.0')).toBe(true);
  });

  it('자리가 모자라면 0으로 채운다 — 1.3은 1.3.0과 같다', () => {
    expect(isAppVersionAtLeast('1.3', '1.3.0')).toBe(true);
  });

  it('숫자로 읽을 수 없는 버전은 낮은 것으로 본다 — 모르는 셸에 기능을 열지 않는다', () => {
    expect(isAppVersionAtLeast('dev', '1.3.0')).toBe(false);
    expect(isAppVersionAtLeast('', '1.3.0')).toBe(false);
  });
});
