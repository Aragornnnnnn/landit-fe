// 구독 날짜 표기 — BE 시각을 서울 기준 "2026년 10월 4일"로. 못 읽으면 null이라 호출부가 줄을 뺀다
import { readSeoulDateParts } from '@/shared/lib/seoul-date';

export const formatSubscriptionDate = (dateTime: string): string | null => {
  const parts = readSeoulDateParts(dateTime, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  if (!parts) return null;
  return `${parts.year}년 ${parts.month}월 ${parts.day}일`;
};
