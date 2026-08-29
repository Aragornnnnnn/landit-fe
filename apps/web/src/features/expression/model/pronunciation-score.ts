// 발음 점수 표시 규칙 — 93% 이상은 통과로 치고 100%로 올려 보여준다 (관대한 경험, 기획 확정)
import type { PronunciationAnalysis } from '../api/pronunciation';

// 기획 확정 통과선 — BE passed(오류 0개)보다 관대하다. 화면 계약은 이 함수가 단일 출처
const PASS_SCORE = 93;

export type ScoreTone = 'red' | 'yellow' | 'green';

export interface ScoreView {
  // 화면에 보여줄 % — 통과면 실제 점수 대신 100
  display: number;
  label: string;
  tone: ScoreTone;
  passed: boolean;
}

// 미통과 피드백에서 래디가 건네는 말 — 점수 구간과 남은 오류 수에 맞춰 달라진다
export const feedbackCoachMessage = (
  view: ScoreView,
  errorCount: number,
): string => {
  if (view.tone === 'red') return '괜찮아요, 천천히 다시 해봐요!';
  if (view.tone === 'yellow') return '좋아요! 빨간 단어들을 다듬어봐요';
  if (errorCount === 1) return '한 단어만 고치면 완벽해요!';
  if (errorCount === 2) return '두 단어만 고치면 완벽해요!';
  return '거의 다 왔어요! 조금만 다듬어봐요';
};

export const scoreView = ({
  score,
  passed,
}: Pick<PronunciationAnalysis, 'score' | 'passed'>): ScoreView => {
  if (passed || score >= PASS_SCORE) {
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
