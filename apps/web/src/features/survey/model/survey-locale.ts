// 설문을 열어 줄 화면 언어 — 문항·보기(원화 가격 포함)가 한국어로만 있어서 한국어 화면에만 연다
import type { Locale } from '@/shared/i18n/locale';

export const opensSurvey = (locale: Locale) => locale === 'ko';
