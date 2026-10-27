// 구독 날짜 표기 — BE 시각을 서울 기준 날짜로, 화면 언어대로 "2026년 10월 4일"·"2026年10月4日". 못 읽으면 null이라 호출부가 줄을 뺀다
import type { Locale } from '@/shared/i18n/locale';
import { readSeoulDateParts } from '@/shared/lib/seoul-date';

export const formatSubscriptionDate = (
  dateTime: string,
  locale: Locale,
): string | null => {
  const parts = readSeoulDateParts(dateTime, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  if (!parts) return null;
  return locale === 'ja'
    ? `${parts.year}年${parts.month}月${parts.day}日`
    : `${parts.year}년 ${parts.month}월 ${parts.day}일`;
};
