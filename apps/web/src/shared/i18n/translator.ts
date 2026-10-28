// 모델 함수가 받는 번역 함수 타입 — 화면이 넘긴 useTranslations 결과를 그대로 받는다
import type { useTranslations } from 'next-intl';

export type Translator<
  Namespace extends NonNullable<Parameters<typeof useTranslations>[0]>,
> = ReturnType<typeof useTranslations<Namespace>>;
