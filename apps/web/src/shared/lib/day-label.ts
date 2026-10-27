// 서버 날짜를 화면 언어대로 「7월 8일」·「7月8日」로 — 스몰톡 기록과 성장 카드가 같이 쓴다
import type { Locale } from '@/shared/i18n/locale';

// 언어마다 한 줄 — 언어가 늘면 여기를 채우지 않고는 타입 검사를 못 지나간다
const DAY_FORMAT: Record<Locale, (month: number, day: number) => string> = {
  ko: (month, day) => `${month}월 ${day}일`,
  ja: (month, day) => `${month}月${day}日`,
};

// 서버가 주는 LocalDateTime(2026-07-28T21:03:11)에는 시간대가 없다.
// Date로 파싱하면 브라우저가 UTC로 읽어 하루가 밀 수 있어 앞의 날짜만 잘라 쓴다
export const toDayLabel = (isoDateTime: string, locale: Locale): string => {
  const [, month, day] = isoDateTime.slice(0, 10).split('-');
  return DAY_FORMAT[locale](Number(month), Number(day));
};
