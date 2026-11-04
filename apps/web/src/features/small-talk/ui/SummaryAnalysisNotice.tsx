// 총평 분석의 진행 안내 — 분석이 끝나면 총평이 설 래디 말풍선 자리에서 기다려, 결과가 와도 화면이 움직이지 않는다
import { useTranslations } from 'next-intl';

import type { SummaryAnalysis } from '../model/summary-analysis';
import { RandiBubble } from './RandiBubble';

export const SummaryAnalysisNotice = ({
  analysis,
  onRetry,
}: {
  analysis: SummaryAnalysis;
  onRetry: () => void;
}) => {
  const t = useTranslations('smallTalk.summaryAnalysis');

  if (analysis === 'ready') return null;

  return (
    <RandiBubble pose="POINT">
      {analysis === 'waiting' ? (
        <div role="status">
          <p>{t('waitingDescription')}</p>
          <span aria-hidden className="mt-2 flex h-2 items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="animate-listening-wave size-1.5 rounded-full bg-muted-foreground"
                style={{ '--i': i } as React.CSSProperties}
              />
            ))}
          </span>
        </div>
      ) : (
        <>
          <p role="status">{t('expiredDescription')}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 text-sm text-primary active:opacity-70"
          >
            {t('retryButton')}
          </button>
        </>
      )}
    </RandiBubble>
  );
};
