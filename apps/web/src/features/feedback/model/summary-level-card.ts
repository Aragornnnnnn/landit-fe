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

/** 총평 카드의 영역 이름과 순서 — 시안(피그마 2618:4714) 기준. 레벨 결과 화면의 이름(DOMAINS)과는 따로 간다 */
const SUMMARY_DOMAINS: { key: DomainKey; label: string }[] = [
  { key: 'situationPerformance', label: '상황 대처 능력' },
  { key: 'vocabulary', label: '어휘력' },
  { key: 'grammar', label: '문법' },
  { key: 'discourse', label: '문장 완성도' },
  { key: 'interactionPragmatics', label: '대화 매너' },
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
    return score === null ? [] : [{ key, label, score: toPercentScore(score) }];
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
  /** 응답 때 분석 중이었을 때 다시 물어 온 결과 */
  polled: {
    outcome: LevelAssessmentOutcome;
    levelAssessment: SessionLevelAssessment | null;
  };
  /** 다시 물으며 기다린 시간이 상한을 넘었는가 */
  timedOut: boolean;
}): SummaryLevelCard => {
  if (!inline || inline.processingStatus === 'FAILED') return HIDDEN;
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
