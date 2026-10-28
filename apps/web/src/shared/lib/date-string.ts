// yyyy-MM-dd 날짜 문자열 계산 — 날짜는 늘 문자열로 다루고, 계산할 때만 UTC 자정 Date로 잠깐 바꿨다 되돌린다.
// 로컬 타임존으로 읽으면 하루가 밀린다. 하루의 경계(오늘)는 서버가 정하고, 여기엔 기기 시계를 읽는 함수가 없다
import type { Locale } from '@/shared/i18n/locale';

/** 날짜 문자열을 UTC 자정 Date로 읽는다 */
export const parseDateString = (date: string) => new Date(`${date}T00:00:00Z`);

/** UTC 자정 Date를 날짜 문자열로 되돌린다 — parseDateString으로 만든 Date에만 쓴다 */
export const toDateString = (value: Date) => value.toISOString().slice(0, 10);

/** 날짜를 하루 단위로 민다. UTC 자정끼리의 계산이라 서머타임도 끼어들지 않는다 */
export const shiftDay = (date: string, delta: number) => {
  const value = parseDateString(date);
  value.setUTCDate(value.getUTCDate() + delta);
  return toDateString(value);
};

// 일요일 시작 — 서버가 주 창을 일요일부터 내려주는 것과 맞춘다. 언어가 늘면 여기를 채우지 않고는 타입 검사를 못 지나간다
export const WEEKDAY_LABELS: Record<Locale, readonly string[]> = {
  ko: ['일', '월', '화', '수', '목', '금', '토'],
  ja: ['日', '月', '火', '水', '木', '金', '土'],
};

/** 그 날의 요일 한 글자 */
export const weekdayLabelOf = (date: string, locale: Locale) =>
  WEEKDAY_LABELS[locale][parseDateString(date).getUTCDay()];
