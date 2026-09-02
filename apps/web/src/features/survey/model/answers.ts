// 답변 규칙 — 어떤 답이면 다음으로 넘어갈 수 있는지, 어떤 문항이 보이는지, 제출할 때 어떤 모양으로 싣는지
import { OTHER_OPTION, otherKey, type Question } from './questions';

// 단일·주관식·기타 입력은 문자열, 복수는 고른 선택지 배열, 척도는 점수. 아직 안 답했으면 없다
export type Answer = string | string[] | number;
export type Answers = Record<string, Answer | undefined>;

export const canProceed = (question: Question, answer: Answer | undefined) => {
  switch (question.kind) {
    case 'single':
      return typeof answer === 'string';
    case 'multi':
      return Array.isArray(answer) && answer.length > 0;
    case 'scale':
      return typeof answer === 'number';
    case 'text':
      // 주관식은 선택 — 비워 두는 것도 답이다
      return true;
  }
};

export const toggleChoice = (current: Answer | undefined, option: string) => {
  const chosen = Array.isArray(current) ? current : [];
  return chosen.includes(option)
    ? chosen.filter((item) => item !== option)
    : [...chosen, option];
};

// 지금 답 기준으로 보여줄 문항 — 조건 문항은 앞 문항의 답이 맞을 때만 끼어든다
export const visibleQuestions = (
  questions: readonly Question[],
  answers: Answers,
) =>
  questions.filter(
    (question) =>
      !question.showIf ||
      answers[question.showIf.questionId] === question.showIf.equals,
  );

const hasOther = (answer: Answer | undefined) =>
  answer === OTHER_OPTION ||
  (Array.isArray(answer) && answer.includes(OTHER_OPTION));

const trimmed = (value: Answer | undefined) =>
  typeof value === 'string' ? value.trim() : '';

// 저장할 모양 — 보이는 문항만, 문항 순서대로. 주관식·기타 입력은 다듬고 빈 답은 뺀다
export const toSubmission = (
  questions: readonly Question[],
  answers: Answers,
): Record<string, Answer> => {
  const submission: Record<string, Answer> = {};
  for (const question of visibleQuestions(questions, answers)) {
    const answer = answers[question.id];
    if (answer === undefined) continue;
    if (question.kind === 'text') {
      const text = trimmed(answer);
      if (text) submission[question.id] = text;
      continue;
    }
    submission[question.id] = answer;
    if (hasOther(answer)) {
      const other = trimmed(answers[otherKey(question.id)]);
      if (other) submission[otherKey(question.id)] = other;
    }
  }
  return submission;
};
