// 총평의 영역 점수 카드를 무엇으로 그릴지 — 응답에 실린 평가가 끝났으면 그대로, 분석 중이면 다시 물어 온 결과를 기다리고, 못 쓰면 숨긴다
import type {
  SessionLevelAssessment,
  SessionLevelAssessmentResponse,
} from '../api/level-assessment';
import {
  isUsableAssessment,
  toPercentScore,
  type DomainKey,
} from './level-assessment';
import type { LevelAssessmentOutcome } from './useLevelAssessmentQuery';

/**
 * 총평 카드의 영역 이름·순서·설명 — 이름과 순서는 시안(피그마 2618:4714) 기준. 레벨 결과 화면의 이름(DOMAINS)과는 따로 간다.
 * 설명은 (i) 툴팁에 쓴다
 */
// TODO: 설명은 임시 문구 — 제품 확정 카피로 교체.
export const SUMMARY_DOMAINS: {
  key: DomainKey;
  label: string;
  description: string;
}[] = [
  {
    key: 'situationPerformance',
    label: '상황 대처 능력',
    description: '상황에 맞게 해야 할 말을 해냈는지',
  },
  {
    key: 'vocabulary',
    label: '어휘력',
    description: '상황에 어울리는 단어를 골라 썼는지',
  },
  {
    key: 'grammar',
    label: '문법',
    description: '시제·어순 같은 문법을 맞게 썼는지',
  },
  {
    key: 'discourse',
    label: '문장 완성도',
    description: '생각을 끝까지 이어 완결된 문장으로 말했는지',
  },
  {
    key: 'interactionPragmatics',
    label: '대화 매너',
    description: '상대 말에 반응하며 자연스럽게 주고받았는지',
  },
];

export interface SummaryDomainRow {
  key: DomainKey;
  label: string;
  /** 100점 환산 */
  score: number;
}

export type SummaryLevelCard =
  | { kind: 'hidden' }
  | { kind: 'loading' }
  | { kind: 'ready'; rows: SummaryDomainRow[]; improvement: string | null };

const HIDDEN: SummaryLevelCard = { kind: 'hidden' };

const toReadyCard = (assessment: SessionLevelAssessment): SummaryLevelCard => {
  // FALLBACK·근거 부족은 기본값으로 채운 점수라 보여주면 거짓이 된다
  if (!isUsableAssessment(assessment)) return HIDDEN;
  const rows = SUMMARY_DOMAINS.flatMap(({ key, label }) => {
    const { score } = assessment[key];
    return score === null
      ? []
      : [{ key, label, score: toPercentScore(score, assessment.scoreMax) }];
  });
  if (rows.length === 0) return HIDDEN;
  return {
    kind: 'ready',
    rows,
    improvement: assessment.details?.improvement ?? null,
  };
};

export const decideSummaryLevelCard = ({
  inline,
  polled,
  timedOut,
}: {
  /** 총평 응답에 실린 평가. 평가 비활성 세션이면 null, 구버전 응답이면 undefined */
  inline: SessionLevelAssessmentResponse | null | undefined;
  /** 응답 때 분석 중(PREPARING)이었을 때 다시 물어 온 결과 */
  polled: {
    outcome: LevelAssessmentOutcome;
    levelAssessment: SessionLevelAssessment | null;
  };
  /** 다시 물으며 기다린 시간이 상한을 넘었는가 */
  timedOut: boolean;
}): SummaryLevelCard => {
  // NOT_REQUESTED는 처리 상태가 기록되지 않은 과거 세션이라 기다려도 결과가 오지 않는다
  if (
    !inline ||
    inline.processingStatus === 'FAILED' ||
    inline.processingStatus === 'NOT_REQUESTED'
  ) {
    return HIDDEN;
  }
  if (inline.processingStatus === 'COMPLETED') {
    return inline.levelAssessment
      ? toReadyCard(inline.levelAssessment)
      : HIDDEN;
  }
  // 상한이 지나 거둔 카드는 늦게 온 결과로 되살리지 않는다 — 보던 아래 카드가 밀린다
  if (timedOut) return HIDDEN;
  if (polled.outcome === 'ready') {
    return polled.levelAssessment
      ? toReadyCard(polled.levelAssessment)
      : HIDDEN;
  }
  if (polled.outcome === 'unavailable') return HIDDEN;
  return { kind: 'loading' };
};
