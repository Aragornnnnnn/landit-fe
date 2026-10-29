// 편지 날짜 표기 — 서버가 주는 시각을 서울 기준으로 읽어 화면 문구로 바꾼다
import type { Locale } from '@/shared/i18n/locale';
import { readSeoulDateParts } from '@/shared/lib/seoul-date';

// 편지 시각 조각 — 서울 기준으로 읽는 규칙은 shared/lib/seoul-date에 있다
const readSeoulDate = (sentAt: string) =>
  readSeoulDateParts(sentAt, {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    // h23이라야 자정이 24시로 나오지 않는다
    hourCycle: 'h23',
  });

type DateParts = NonNullable<ReturnType<typeof readSeoulDate>>;

// 리스트용 — `26.08.09`·`26/08/09`. 좁은 한 줄에 연도까지 넣어야 해서 두 자리로 줄인다
const DATE_FORMAT: Record<Locale, (parts: DateParts) => string> = {
  ko: ({ year, month, day }) => `${year}.${month}.${day}`,
  ja: ({ year, month, day }) => `${year}/${month}/${day}`,
};

// 상세용 — `8월 9일 오전 11:30`·`8月9日 午前11:30`. 편지 한 통을 펼쳐 보는 자리라 시각까지 읽어 준다
const DATE_TIME_FORMAT: Record<
  Locale,
  (parts: DateParts & { morning: boolean; hour24: number }) => string
> = {
  ko: ({ month, day, morning, hour24, minute }) =>
    `${Number(month)}월 ${Number(day)}일 ${morning ? '오전' : '오후'} ${hour24 % 12 || 12}:${minute}`,
  // 일본은 자정·정오를 午前0時·午後0時로 쓴다 — 午前12時는 정오로도 읽힌다
  ja: ({ month, day, morning, hour24, minute }) =>
    `${Number(month)}月${Number(day)}日 ${morning ? '午前' : '午後'}${hour24 % 12}:${minute}`,
};

export const formatLetterDate = (sentAt: string, locale: Locale) => {
  const parts = readSeoulDate(sentAt);
  if (!parts) return '';

  return DATE_FORMAT[locale](parts);
};

export const formatLetterDateTime = (sentAt: string, locale: Locale) => {
  const parts = readSeoulDate(sentAt);
  if (!parts) return '';

  const hour24 = Number(parts.hour);
  return DATE_TIME_FORMAT[locale]({
    ...parts,
    morning: hour24 < 12,
    hour24,
  });
};
