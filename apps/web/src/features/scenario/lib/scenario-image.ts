// 시나리오 번들 이미지 — scenarioId로 정적 import한 이미지를 찾는다(백엔드 S3 썸네일 전까지 임시).
// next/image의 blurDataURL·크기 자동 생성을 쓰려면 정적 import여야 해서 파일마다 명시적으로 import한다.
import type { StaticImageData } from 'next/image';

import scenario1 from '../assets/scenarios/scenario-1.webp';
import scenario2 from '../assets/scenarios/scenario-2.webp';
import scenario3 from '../assets/scenarios/scenario-3.webp';
import scenario4 from '../assets/scenarios/scenario-4.webp';
import scenario5 from '../assets/scenarios/scenario-5.webp';
import scenario6 from '../assets/scenarios/scenario-6.webp';
import scenario7 from '../assets/scenarios/scenario-7.webp';
import scenario8 from '../assets/scenarios/scenario-8.webp';
import scenario9 from '../assets/scenarios/scenario-9.webp';
import scenario10 from '../assets/scenarios/scenario-10.webp';
import scenario11 from '../assets/scenarios/scenario-11.webp';
import scenario12 from '../assets/scenarios/scenario-12.webp';
import scenario13 from '../assets/scenarios/scenario-13.webp';
import scenario14 from '../assets/scenarios/scenario-14.webp';
import scenario15 from '../assets/scenarios/scenario-15.webp';
import scenario16 from '../assets/scenarios/scenario-16.webp';
import scenario17 from '../assets/scenarios/scenario-17.webp';
import scenario18 from '../assets/scenarios/scenario-18.webp';
import scenario19 from '../assets/scenarios/scenario-19.webp';
import scenario20 from '../assets/scenarios/scenario-20.webp';

// scenarioId → 번들 이미지. 백엔드 scenarioId가 파일 순번(1~20)과 맞물린다는 가정.
const BUNDLED_IMAGES: Record<number, StaticImageData> = {
  1: scenario1,
  2: scenario2,
  3: scenario3,
  4: scenario4,
  5: scenario5,
  6: scenario6,
  7: scenario7,
  8: scenario8,
  9: scenario9,
  10: scenario10,
  11: scenario11,
  12: scenario12,
  13: scenario13,
  14: scenario14,
  15: scenario15,
  16: scenario16,
  17: scenario17,
  18: scenario18,
  19: scenario19,
  20: scenario20,
};

// scenarioId에 해당하는 번들 이미지. 없으면 null(소비 지점이 이모지로 폴백한다).
export const getScenarioImage = (scenarioId: number): StaticImageData | null =>
  BUNDLED_IMAGES[scenarioId] ?? null;
