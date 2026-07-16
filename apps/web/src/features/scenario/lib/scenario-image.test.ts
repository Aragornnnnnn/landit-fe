import { describe, expect, it } from 'vitest';

import { getScenarioImage } from './scenario-image';

describe('getScenarioImage', () => {
  it('번들된 scenarioId면 해당 이미지를 돌려준다', () => {
    // given — 번들 범위(1~20) 안의 id

    // when
    const image = getScenarioImage(1);

    // then
    expect(image).toBeTruthy();
  });

  it('번들 범위를 벗어난 id면 이미지가 없다고 알린다', () => {
    // given — 번들되지 않은 id

    // when
    const image = getScenarioImage(99);

    // then — 소비 지점이 이모지로 폴백할 수 있게 null을 준다
    expect(image).toBeNull();
  });
});
