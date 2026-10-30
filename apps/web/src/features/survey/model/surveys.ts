// 설문 종류별 주소와 문항 — 일반 설문은 마이페이지·안내 편지로, 결제자 설문은 안내 편지로만 연다
import type { SurveyKind } from '@landit/analytics';

import { PAID_SURVEY_PATH, SURVEY_PATH } from '@/shared/lib/routes';

import type { Answer } from './answers';
import { PAID_QUESTIONS } from './paid-questions';
import { QUESTIONS, type Question } from './questions';

// 안내 화면 문구 — 줄바꿈은 \n으로 적는다
export interface SurveyIntroCopy {
  title: string;
  subtitle: string;
}

export const SURVEYS: Record<
  SurveyKind,
  {
    path: string;
    questions: readonly Question[];
    // 없으면 안내 없이 첫 문항부터 연다 — 들어오는 편지가 안내를 대신한다
    intro?: SurveyIntroCopy;
  }
> = {
  general: {
    path: SURVEY_PATH,
    questions: QUESTIONS,
    intro: {
      title: '2분만 내주시면\n랜딧이 더 좋아져요',
      subtitle: '쓰면서 느낀 점을\n솔직하게 들려주세요',
    },
  },
  paid: {
    path: PAID_SURVEY_PATH,
    questions: PAID_QUESTIONS,
  },
};

export const isSurveyKind = (value: unknown): value is SurveyKind =>
  typeof value === 'string' && Object.hasOwn(SURVEYS, value);

// 필수 주관식이 다 채워졌는가 — 화면이 막아 두지만 서버도 같은 규칙으로 한 번 더 본다
export const fillsRequired = (
  kind: SurveyKind,
  answers: Record<string, Answer>,
) =>
  SURVEYS[kind].questions.every((question) => {
    if (question.kind !== 'text' || !question.required) return true;
    const answer = answers[question.id];
    return typeof answer === 'string' && answer.trim().length > 0;
  });
