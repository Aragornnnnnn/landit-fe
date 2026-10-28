// 수준 평가 결과를 화면 값으로 — 레벨 이름, 영역 라벨, 100점 환산, 결과를 보여줘도 되는지
import type { EnglishLevel } from '@landit/analytics';

// 가로 import 사유: 1~5 수준 척도와 그 검증은 온보딩 슬라이스가 정본이다
import { toEnglishLevel } from '@/features/onboarding/model/english-level';
import type { PreloadableImage } from '@/shared/lib/preload-next-images';

import type { SessionLevelAssessment } from '../api/level-assessment';

/** 레벨 이름의 문구 키(feedback.levelNames) — 래디의 마법사 성장 단계 (피그마 2136:2437, 2026-09-08) */
export const LEVEL_NAME_KEYS = {
  1: 'babyLabel',
  2: 'noviceLabel',
  3: 'apprenticeLabel',
  4: 'beginnerLabel',
  5: 'intermediateLabel',
} as const satisfies Record<EnglishLevel, string>;

/** 레벨별 마법사 래디 — 피그마 2136:2437에서 배경 제거한 원본을 480px webp로. 레벨 결과와 마이페이지가 같이 쓴다 */
// next/image에 그대로 펼친다 — 미리 받는 곳(대화 직후 흐름·마이페이지)과 그리는 곳이 같은 주소를 쓰게 크기까지 여기 둔다
export const LEVEL_IMAGES: Record<EnglishLevel, PreloadableImage> = {
  1: { src: '/images/character/level-wizard-1.webp', width: 200, height: 200 },
  2: { src: '/images/character/level-wizard-2.webp', width: 200, height: 200 },
  3: { src: '/images/character/level-wizard-3.webp', width: 200, height: 200 },
  4: { src: '/images/character/level-wizard-4.webp', width: 200, height: 200 },
  5: { src: '/images/character/level-wizard-5.webp', width: 200, height: 200 },
};

export type DomainKey =
  | 'situationPerformance'
  | 'grammar'
  | 'vocabulary'
  | 'discourse'
  | 'interactionPragmatics';

/** 평가 영역 다섯 개 — 시안 순서. 이름(읽어 주는 이름·그래프 꼭짓점 이름)은 feedback.domains 문구에서 읽는다 */
export const DOMAINS: readonly DomainKey[] = [
  'situationPerformance',
  'grammar',
  'vocabulary',
  'discourse',
  'interactionPragmatics',
];

// scoreMax가 없는 구버전 응답의 척도
const LEGACY_SCORE_MAX = 5;

/** BE 점수를 화면의 100점으로 환산한다 — scoreMax 만점 비율 그대로 반올림. 새 평가는 이미 100점 척도다 (2026-09-09 확정, 10-01 scoreMax 반영) */
export const toPercentScore = (score: number, scoreMax = LEGACY_SCORE_MAX) =>
  Math.round((score / scoreMax) * 100);

/** 확정 문장("OO님의 레벨은 ~")을 써도 되는 결과 — 모델 결과이고 근거가 충분하며 수준이 1~5로 매겨진 것 */
export type UsableAssessment = SessionLevelAssessment & {
  assessedLevel: EnglishLevel;
};

/**
 * 결과를 화면에 보여줘도 되는지 — FALLBACK·근거 부족은 displayLevel이 기본값 3으로 채워져 오므로
 * 그걸 레벨로 보여주면 거짓이 된다
 */
export const isUsableAssessment = (
  assessment: SessionLevelAssessment | null | undefined,
): assessment is UsableAssessment =>
  !!assessment &&
  assessment.source === 'MODEL' &&
  assessment.sufficientEvidence &&
  toEnglishLevel(assessment.assessedLevel) !== null;

export interface DomainRow {
  key: DomainKey;
  /** 100점 환산 */
  score: number;
}

export interface LevelResult {
  level: EnglishLevel;
  /** 관찰이 없는 영역은 뺀다 */
  rows: DomainRow[];
}

/** 한 영역의 100점 환산 점수 — 관찰이 없으면 null. 레벨 결과와 총평 카드가 같은 환산을 쓴다 */
export const toDomainPercent = (
  assessment: SessionLevelAssessment,
  key: DomainKey,
): number | null => {
  const { score } = assessment[key];
  return score === null ? null : toPercentScore(score, assessment.scoreMax);
};

/** 쓸 만한 결과를 레벨 결과 화면의 값으로 바꾼다 */
export const toLevelResult = (assessment: UsableAssessment): LevelResult => ({
  level: assessment.assessedLevel,
  rows: DOMAINS.flatMap((key) => {
    const score = toDomainPercent(assessment, key);
    return score === null ? [] : [{ key, score }];
  }),
});
