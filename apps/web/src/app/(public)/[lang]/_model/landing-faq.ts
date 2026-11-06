// 랜딩 자주 묻는 질문 — 화면과 구조화 데이터가 같은 문구를 쓰는 단일 출처. AI 답변이 그대로 인용할 수 있게 첫 문장에 답을 쓴다
import type { Translator } from '@/shared/i18n/translator';

/** 질문 순서 — 문구는 landing.faq의 `{주제}Title`(질문)·`{주제}Body`(답) */
const FAQ_TOPICS = [
  'about',
  'difference',
  'thought',
  'audience',
  'situation',
  'beginner',
  'start',
] as const;

export const buildLandingFaq = (t: Translator<'landing'>) =>
  FAQ_TOPICS.map((topic) => ({
    question: t(`faq.${topic}Title`),
    answer: t(`faq.${topic}Body`),
  }));
