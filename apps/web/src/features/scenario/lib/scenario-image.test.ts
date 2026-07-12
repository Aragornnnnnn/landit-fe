import { describe, expect, it } from 'vitest';

import { resolveScenarioImage } from './scenario-image';

describe('resolveScenarioImage', () => {
  it('백엔드 썸네일이 있으면 그 URL을 그대로 쓴다', () => {
    // given — 백엔드가 S3 썸네일을 내려준 시나리오
    const scenario = { scenarioId: 3, thumbnailUrl: 'https://cdn/x.png' };

    // when
    const url = resolveScenarioImage(scenario);

    // then — 로컬 번들보다 백엔드 썸네일이 우선한다
    expect(url).toBe('https://cdn/x.png');
  });

  it('썸네일이 없고 번들된 id면 scenarioId로 로컬 이미지를 매칭한다', () => {
    // given — 썸네일 없이 번들 범위(1~20) 안의 시나리오
    const scenario = { scenarioId: 1, thumbnailUrl: null };

    // when
    const url = resolveScenarioImage(scenario);

    // then
    expect(url).toBe('/images/scenarios/scenario-1.webp');
  });

  it('썸네일이 없고 번들 범위를 벗어나면 이미지가 없다고 알린다', () => {
    // given — 번들되지 않은 id
    const scenario = { scenarioId: 99, thumbnailUrl: null };

    // when
    const url = resolveScenarioImage(scenario);

    // then — 소비 지점이 이모지로 폴백할 수 있게 null을 준다
    expect(url).toBeNull();
  });
});
