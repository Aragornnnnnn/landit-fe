// 시나리오 카드 이미지 경로 결정 — 백엔드 S3 썸네일이 아직 없어 scenarioId로 번들 이미지를 매칭한다
import type { Scenario } from '../api/list';

// public/images/scenarios 에 번들된 이미지의 scenarioId 집합. 이 범위를 벗어나면 이미지가 없다.
const BUNDLED_IMAGE_IDS = new Set(Array.from({ length: 20 }, (_, i) => i + 1));

// 백엔드 썸네일이 있으면 그대로, 없으면 scenarioId로 로컬 번들 이미지를 찾는다. 둘 다 없으면 null.
export const resolveScenarioImage = (
  scenario: Pick<Scenario, 'scenarioId' | 'thumbnailUrl'>,
): string | null => {
  if (scenario.thumbnailUrl) return scenario.thumbnailUrl;
  if (BUNDLED_IMAGE_IDS.has(scenario.scenarioId)) {
    return `/images/scenarios/scenario-${scenario.scenarioId}.webp`;
  }
  return null;
};
