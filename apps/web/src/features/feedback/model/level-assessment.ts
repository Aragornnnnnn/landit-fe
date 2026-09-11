// 수준 평가 결과를 화면 값으로 — 레벨 이름, 영역 라벨, 100점 환산, 결과를 보여줘도 되는지
import type { EnglishLevel } from '@landit/analytics';

// 가로 import 사유: 1~5 수준 척도와 그 검증은 온보딩 슬라이스가 정본이다
import { toEnglishLevel } from '@/features/onboarding/model/english-level';

import type { SessionLevelAssessment } from '../api/level-assessment';

/** 레벨 이름 — 래디의 마법사 성장 단계 (피그마 2136:2437, 2026-09-08) */
export const LEVEL_NAMES: Record<EnglishLevel, string> = {
  1: '애기 마법사',
  2: '입문 마법사',
  3: '견습 마법사',
  4: '초급 마법사',
  5: '중급 마법사',
};

/** 레벨별 마법사 래디 — 피그마 2136:2437에서 배경 제거한 원본을 480px webp로. 레벨 결과와 마이페이지가 같이 쓴다 */
export const LEVEL_IMAGES: Record<EnglishLevel, string> = {
  1: '/images/character/level-wizard-1.webp',
  2: '/images/character/level-wizard-2.webp',
  3: '/images/character/level-wizard-3.webp',
  4: '/images/character/level-wizard-4.webp',
  5: '/images/character/level-wizard-5.webp',
};

export type DomainKey =
  | 'situationPerformance'
  | 'grammar'
  | 'vocabulary'
  | 'discourse'
  | 'interactionPragmatics';

/** 평가 영역 다섯 개 — 시안 순서. label은 읽어 주는 이름, shortLabel은 그래프 꼭짓점에 쓴다 */
export const DOMAINS: { key: DomainKey; label: string; shortLabel: string }[] =
  [
    {
      key: 'situationPerformance',
      label: '상황 수행 능력',
      shortLabel: '상황 수행',
    },
    { key: 'grammar', label: '문법', shortLabel: '문법' },
    { key: 'vocabulary', label: '어휘', shortLabel: '어휘' },
    { key: 'discourse', label: '대화 구성', shortLabel: '대화 구성' },
    {
      key: 'interactionPragmatics',
      label: '상호 작용 및 활용',
      shortLabel: '상호 작용',
    },
  ];

/** BE 점수는 1~5 척도라 화면의 100점으로 환산한다 — 5점 만점 비율 그대로 반올림 (2026-09-09 확정) */
export const toPercentScore = (score: number) => Math.round((score / 5) * 100);

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
  label: string;
  shortLabel: string;
  /** 100점 환산 */
  score: number;
}

export interface LevelResult {
  level: EnglishLevel;
  name: string;
  /** 관찰이 없는 영역은 뺀다 */
  rows: DomainRow[];
}

/** 쓸 만한 결과를 레벨 결과 화면의 값으로 바꾼다 */
export const toLevelResult = (assessment: UsableAssessment): LevelResult => ({
  level: assessment.assessedLevel,
  name: LEVEL_NAMES[assessment.assessedLevel],
  rows: DOMAINS.flatMap(({ key, label, shortLabel }) => {
    const { score } = assessment[key];
    return score === null
      ? []
      : [{ key, label, shortLabel, score: toPercentScore(score) }];
  }),
});
