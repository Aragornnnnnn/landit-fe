// 대화가 끝난 자리 — 점수도 총평도 없는 대화라 남길 건 얼마나 얘기했는지뿐이다. 전부 타이핑했으면 말한 시간 칸은 뺀다
import { useLocale, useTranslations } from 'next-intl';

import { hasSpokenTime, toSpeakingTimeLabel } from '../lib/speaking-time';

interface TalkSummaryProps {
  speakingDurationMs: number;
  exchangeCount: number;
}

export const TalkSummary = ({
  speakingDurationMs,
  exchangeCount,
}: TalkSummaryProps) => {
  const t = useTranslations('conversation.talkSummary');
  const locale = useLocale();
  const spoke = hasSpokenTime(speakingDurationMs);
  return (
    <div className="mt-4 flex items-center rounded-2xl bg-card px-6 py-4 shadow-sm">
      {spoke && (
        <>
          <Stat
            label={t('speakingTimeLabel')}
            value={toSpeakingTimeLabel(speakingDurationMs, locale)}
          />
          <div className="h-12 w-px bg-border" />
        </>
      )}
      <Stat
        label={t('exchangeLabel')}
        value={t('exchangeCountLabel', { count: exchangeCount })}
        className={spoke ? 'pl-6' : ''}
      />
    </div>
  );
};

const Stat = ({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string;
  className?: string;
}) => (
  <div className={`flex-1 ${className}`}>
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-1 text-lg font-extrabold text-foreground">{value}</p>
  </div>
);
