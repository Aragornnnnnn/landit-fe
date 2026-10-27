// 알람 한 줄 요약 — 내 정보 알람 행 오른쪽 값. 권한이 막혀 안 울리면 시각보다 그걸 먼저 알린다
import type { Locale } from '@/shared/i18n/locale';
import type { Translator } from '@/shared/i18n/translator';

import { formatAlarmTime, parseAlarmTime } from './alarm-time';

export const alarmSummary = (
  {
    registered,
    blocked,
    time,
  }: {
    registered: boolean;
    blocked: boolean;
    time: string | null;
  },
  t: Translator<'alarm'>,
  locale: Locale,
) => {
  if (!registered) return { text: t('summary.noneLabel'), alert: false };
  if (blocked) return { text: t('summary.blockedLabel'), alert: true };
  return {
    text: t('summary.dailyLabel', {
      time: formatAlarmTime(parseAlarmTime(time), locale),
    }),
    alert: false,
  };
};
