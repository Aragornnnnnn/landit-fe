// 구독 날짜 표기 — BE 시각을 서울 기준 날짜로, 화면 언어대로 "2026년 10월 4일"·"2026年10月4日". 못 읽으면 null이라 호출부가 줄을 뺀다
import type { Locale } from '@/shared/i18n/locale';
import { readSeoulDateParts } from '@/shared/lib/seoul-date';

type DateParts = NonNullable<ReturnType<typeof readSeoulDateParts>>;

// 언어마다 한 줄 — 언어가 늘면 여기를 채우지 않고는 타입 검사를 못 지나간다
const DATE_FORMAT: Record<Locale, (parts: DateParts) => string> = {
  ko: ({ year, month, day }) => `${year}년 ${month}월 ${day}일`,
  ja: ({ year, month, day }) => `${year}年${month}月${day}日`,
};

export const formatSubscriptionDate = (
  dateTime: string,
  locale: Locale,
): string | null => {
  const parts = readSeoulDateParts(dateTime, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  return parts ? DATE_FORMAT[locale](parts) : null;
};
