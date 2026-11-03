// 총평 분석의 진행 안내 — 통계를 먼저 보여 주는 동안 분석 자리를 지키고, 일부만 분석됐으면 함께 알린다
import { useTranslations } from 'next-intl';

import type { SummaryAnalysis } from '../model/summary-analysis';

export const SummaryAnalysisNotice = ({
  analysis,
  onRetry,
}: {
  analysis: SummaryAnalysis;
  onRetry: () => void;
}) => {
  const t = useTranslations('smallTalk.summaryAnalysis');

  if (analysis === 'ready') return null;
  if (analysis === 'partial')
    return (
      <p className="px-1 text-sm text-muted-foreground">
        {t('partialDescription')}
      </p>
    );
  if (analysis === 'waiting')
    return (
      <div role="status" className="rounded-2xl bg-card px-5 py-4 shadow-sm">
        <p className="animate-text-shimmer text-sm font-semibold">
          {t('waitingDescription')}
        </p>
      </div>
    );
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-card px-5 py-4 shadow-sm">
      <p
        role="status"
        className="min-w-0 text-sm font-semibold break-keep text-foreground"
      >
        {t('expiredDescription')}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="flex-none text-sm font-bold text-primary active:opacity-70"
      >
        {t('retryButton')}
      </button>
    </div>
  );
};
