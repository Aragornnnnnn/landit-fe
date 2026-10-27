// 답 하나의 글자 수 한도 — 말이든 키보드든 이보다 긴 답은 받지 않는다(영어 180단어·말로 1분 남짓)
export const ANSWER_MAX_LENGTH = 1000;

export const clampAnswer = (text: string) => text.slice(0, ANSWER_MAX_LENGTH);
