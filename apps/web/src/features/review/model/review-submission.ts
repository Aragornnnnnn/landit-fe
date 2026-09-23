// 답안 제출의 멱등 키 — 네트워크 재전송만 같은 id로 보내고, 새 시도는 새 id로 보낸다
export interface PendingSubmission {
  submissionId: string;
  questionId: string;
  words: string[];
}

const sameWords = (left: string[], right: string[]) =>
  left.length === right.length &&
  left.every((word, index) => word === right[index]);

/**
 * 보낼 제출을 만든다. 같은 문제에 같은 단어열이면 앞서 쓴 제출 id를 그대로 재사용한다 —
 * 서버가 같은 판정을 돌려주므로 실패한 전송을 안전하게 다시 보낼 수 있다.
 * 내용이 다르면 새 시도라 id를 새로 만든다 (같은 id에 다른 내용은 서버가 409로 거절한다).
 */
export const submissionFor = (
  pending: PendingSubmission | null,
  questionId: string,
  words: string[],
  createId: () => string,
): PendingSubmission =>
  pending &&
  pending.questionId === questionId &&
  sameWords(pending.words, words)
    ? pending
    : { submissionId: createId(), questionId, words };
