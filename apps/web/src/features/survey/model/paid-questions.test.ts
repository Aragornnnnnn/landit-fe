// 결제자 설문 만족 기능 보기 — 롤플레이는 스위치를 켠 때만 보인다
import { describe, expect, it } from 'vitest';

import { likedFeatureOptions } from './paid-questions';

describe('likedFeatureOptions', () => {
  it('스위치가 꺼져 있으면 롤플레이를 보여 주지 않는다', () => {
    expect(likedFeatureOptions(false)).not.toContain('롤플레이');
  });

  it('스위치를 켜면 스몰톡 바로 뒤에 롤플레이를 보여 준다', () => {
    const options = likedFeatureOptions(true);

    expect(options[options.indexOf('스몰톡') + 1]).toBe('롤플레이');
  });
});
