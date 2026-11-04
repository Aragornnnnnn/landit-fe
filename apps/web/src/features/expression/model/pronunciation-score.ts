// 발음 점수 표시 규칙 — 통과 판정은 BE passed를 그대로 따르고, 여기선 구간별 표시만 정한다
import type {
  PronunciationAnalysis,
  PronunciationWord,
} from '../api/pronunciation';

export type ScoreTone = 'red' | 'yellow' | 'green';

export interface ScoreView {
  display: number;
  label: string;
  tone: ScoreTone;
  // 100점 통과 — 더 고칠 게 없어 축하 화면을 보여준다
  perfect: boolean;
}

// 단어 색 경계 — 이 점수 이상이면 초록, 노랑
const GREEN_WORD_MIN = 81;
const YELLOW_WORD_MIN = 51;

/** 맞음 판정이어도 교정 카드를 보여줄 단어인지 — 점수 없는 응답은 판정만 따른다 */
export const isLowScoreWord = ({ score }: PronunciationWord): boolean =>
  score != null && score < 100;

/**
 * 단어 색을 정한다 — 점수가 있으면 점수, 없으면 판정 기준.
 * 오류 단어는 점수가 높게 와도 맞은 것처럼 보이지 않게 초록을 쓰지 않는다.
 */
export const wordTone = ({ score, status }: PronunciationWord): ScoreTone => {
  if (score != null && score < GREEN_WORD_MIN) {
    return score >= YELLOW_WORD_MIN ? 'yellow' : 'red';
  }
  return status === 'CORRECT' ? 'green' : 'red';
};

/**
 * 분석 결과를 화면 표시 규칙으로 바꾼다 — 통과 여부는 BE passed 그대로, 구간별 라벨·색만 정한다.
 *
 * @returns 100점 통과는 Perfect, 95~99점 통과는 Excellent(50점 이하 단어가 있으면 Great), 미통과는 구간 라벨(Great/Good/Keep going)
 */
export const scoreView = ({
  score,
  passed,
  words,
}: Pick<PronunciationAnalysis, 'score' | 'passed' | 'words'>): ScoreView => {
  const base = { display: score, perfect: false };
  if (passed) {
    if (score === 100) {
      return { ...base, label: 'Perfect!', tone: 'green', perfect: true };
    }
    const hasRedWord = words.some(
      (word) => word.score != null && wordTone(word) === 'red',
    );
    return {
      ...base,
      label: hasRedWord ? 'Great!' : 'Excellent!',
      tone: 'green',
    };
  }
  if (score >= 71) return { ...base, label: 'Great!', tone: 'green' };
  if (score >= 41) return { ...base, label: 'Good!', tone: 'yellow' };
  return { ...base, label: 'Keep going!', tone: 'red' };
};
