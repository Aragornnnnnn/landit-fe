// 복습 문제 큐 — 풀 문제의 인덱스를 순서대로 든다. 맨 앞이 지금 문제, 틀리면 맨 뒤로 보내 맞출 때까지 다시 낸다

export type QuizResult = 'correct' | 'wrong';

export const settleReviewQueue = (
  pending: number[],
  result: QuizResult,
): number[] => {
  const [current, ...rest] = pending;
  return result === 'correct' ? rest : [...rest, current];
};

// 이만큼 틀리면 정답을 보여준다 — 1회 오답까지는 같은 문제 그대로, 2회부터는 정답을 보고 만든다
const REVEAL_AFTER_WRONGS = 2;

// 재도전 지시문의 문구 키(expression.quizPrompt) — 없으면 기본 지시문
export type RetryInstruction = 'retryTitle' | 'revealAnswerTitle';

// 다시 낼 문제에 붙일 안내 — 지시문과 정답 공개 여부. 학습 안의 복습과 푸시 복습이 같은 규칙을 쓴다
export const retryGuideOf = (
  wrongCount: number,
): { revealAnswer: boolean; instruction: RetryInstruction | undefined } => {
  const revealAnswer = wrongCount >= REVEAL_AFTER_WRONGS;
  return {
    revealAnswer,
    instruction:
      wrongCount === 0
        ? undefined
        : revealAnswer
          ? 'revealAnswerTitle'
          : 'retryTitle',
  };
};
