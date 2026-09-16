// 발음 점수 표시 규칙 — 통과 판정은 BE passed를 그대로 따르고, 여기선 구간별 표시만 정한다
import type { PronunciationAnalysis } from '../api/pronunciation';

export type ScoreTone = 'red' | 'yellow' | 'green';

export interface ScoreView {
  // 화면에 보여줄 % — 통과면 100 고정 (BE 계약상 통과 = 오류 0개라 실점수도 100이다)
  display: number;
  label: string;
  tone: ScoreTone;
  passed: boolean;
}

/**
 * 분석 결과를 화면 표시 규칙으로 바꾼다 — 통과 여부는 BE passed 그대로, 구간별 라벨·색만 정한다.
 *
 * @returns 통과면 display 100 고정, 미통과면 원점수와 구간 라벨(Great/Good/Keep going)
 */
export const scoreView = ({
  score,
  passed,
}: Pick<PronunciationAnalysis, 'score' | 'passed'>): ScoreView => {
  if (passed) {
    return { display: 100, label: 'Perfect!', tone: 'green', passed: true };
  }
  if (score >= 71) {
    return { display: score, label: 'Great!', tone: 'green', passed: false };
  }
  if (score >= 41) {
    return { display: score, label: 'Good!', tone: 'yellow', passed: false };
  }
  return { display: score, label: 'Keep going!', tone: 'red', passed: false };
};
