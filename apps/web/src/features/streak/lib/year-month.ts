// 스트릭 달력의 연·월 도구 — 날짜 계산 자체는 shared/lib/date-string이 맡는다
import type { Locale } from '@/shared/i18n/locale';

export interface YearMonth {
  year: number;
  month: number;
}

export const monthOf = (date: string): YearMonth => ({
  year: Number(date.slice(0, 4)),
  month: Number(date.slice(5, 7)),
});

// 언어마다 한 줄 — 언어가 늘면 여기를 채우지 않고는 타입 검사를 못 지나간다
const MONTH_FORMAT: Record<Locale, (view: YearMonth) => string> = {
  ko: ({ year, month }) => `${year}년 ${month}월`,
  ja: ({ year, month }) => `${year}年${month}月`,
};

export const formatMonthLabel = (view: YearMonth, locale: Locale) =>
  MONTH_FORMAT[locale](view);
