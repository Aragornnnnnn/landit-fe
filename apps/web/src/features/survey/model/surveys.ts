// 설문 종류별 주소와 문항 — 일반 설문은 마이페이지·안내 편지로, 결제자 설문은 안내 편지로만 연다
import type { SurveyKind } from '@landit/analytics';

import { PAID_SURVEY_PATH, SURVEY_PATH } from '@/shared/lib/routes';

import { PAID_QUESTIONS } from './paid-questions';
import { QUESTIONS, type Question } from './questions';

export const SURVEYS: Record<
  SurveyKind,
  { path: string; questions: readonly Question[] }
> = {
  general: { path: SURVEY_PATH, questions: QUESTIONS },
  paid: { path: PAID_SURVEY_PATH, questions: PAID_QUESTIONS },
};

export const isSurveyKind = (value: unknown): value is SurveyKind =>
  typeof value === 'string' && Object.hasOwn(SURVEYS, value);
