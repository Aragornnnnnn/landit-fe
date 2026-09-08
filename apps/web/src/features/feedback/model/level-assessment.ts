// 수준 평가 결과를 화면 값으로 — 레벨 이름, 영역 라벨, 100점 환산, 강점·보완 태그, 결과를 보여줘도 되는지
import type { EnglishLevel } from '@landit/analytics';

import type {
  DomainScore,
  SessionLevelAssessment,
} from '../api/level-assessment';

// 레벨 이름은 래디의 마법사 성장 단계 (피그마 2136:2437, 2026-09-08)
export const LEVEL_NAMES: Record<EnglishLevel, string> = {
  1: '애기 마법사',
  2: '입문 마법사',
  3: '견습 마법사',
  4: '초급 마법사',
  5: '중급 마법사',
};

export type DomainKey =
  | 'situationPerformance'
  | 'grammar'
  | 'vocabulary'
  | 'discourse'
  | 'interactionPragmatics';

export const DOMAINS: { key: DomainKey; label: string }[] = [
  { key: 'situationPerformance', label: '상황 수행 능력' },
  { key: 'grammar', label: '문법' },
  { key: 'vocabulary', label: '어휘' },
  { key: 'discourse', label: '대화 구성' },
  { key: 'interactionPragmatics', label: '상호 작용 및 활용' },
];

// BE 점수는 1~5 척도라 화면의 100점으로 환산한다 — 5점 만점 비율 그대로 (가정, 확정 전)
export const toHundred = (score: number) => Math.round((score / 5) * 100);

export type DomainTag = 'strength' | 'improvement';

export interface DomainRow {
  key: DomainKey;
  label: string;
  score: number;
  tag: DomainTag | null;
}

export interface LevelResult {
  level: EnglishLevel;
  name: string;
  overall: number | null;
  rows: DomainRow[];
}

const toEnglishLevel = (value: number): EnglishLevel | null =>
  value >= 1 && value <= 5 ? (Math.round(value) as EnglishLevel) : null;

// 확정 문장("OO님의 레벨은 ~")을 써도 되는 결과만 통과시킨다 — 모델 결과이고 근거가 충분하며 수준이 매겨진 것.
// FALLBACK·근거 부족은 displayLevel이 기본값 3으로 채워져 오므로 그걸 레벨로 보여주면 거짓이 된다
export const isUsableAssessment = (
  assessment: SessionLevelAssessment | null | undefined,
): assessment is SessionLevelAssessment =>
  !!assessment &&
  assessment.source === 'MODEL' &&
  assessment.sufficientEvidence &&
  assessment.assessedLevel !== null &&
  toEnglishLevel(assessment.assessedLevel) !== null;

// 강점은 가장 높은 영역, 보완은 가장 낮은 영역 하나씩. 점수가 다 같으면 태그를 달지 않는다
export const toLevelResult = (
  assessment: SessionLevelAssessment,
): LevelResult => {
  const level = toEnglishLevel(
    assessment.assessedLevel as number,
  ) as EnglishLevel;
  const scored = DOMAINS.flatMap(({ key, label }) => {
    const domain: DomainScore = assessment[key];
    return domain.score === null
      ? []
      : [
          {
            key,
            label,
            score: toHundred(domain.score),
            tag: null as DomainTag | null,
          },
        ];
  });
  const scores = scored.map((row) => row.score);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const rows =
    scored.length > 1 && max !== min
      ? scored.map((row) => ({
          ...row,
          tag:
            row.score === max &&
            !scored.some((r) => r.tag === 'strength' && r !== row)
              ? ('strength' as const)
              : row.score === min
                ? ('improvement' as const)
                : null,
        }))
      : scored;
  // 최고·최저가 여럿이면 앞쪽 하나만 태그를 단다
  let strengthSeen = false;
  let improvementSeen = false;
  const tagged = rows.map((row) => {
    if (row.tag === 'strength') {
      if (strengthSeen) return { ...row, tag: null };
      strengthSeen = true;
    }
    if (row.tag === 'improvement') {
      if (improvementSeen) return { ...row, tag: null };
      improvementSeen = true;
    }
    return row;
  });

  return {
    level,
    name: LEVEL_NAMES[level],
    overall:
      assessment.assessedScore === null
        ? null
        : toHundred(assessment.assessedScore),
    rows: tagged,
  };
};
