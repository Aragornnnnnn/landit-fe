// 총평 분석의 진행 안내 — 분석이 끝나면 총평이 설 래디 말풍선 자리에서 기다려, 결과가 와도 화면이 움직이지 않는다
import { useTranslations } from 'next-intl';

import { toPoseImage } from '../model/randi-pose';
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
      <p className="-mt-1 text-right text-xs leading-5 break-keep text-muted-foreground">
        {t('partialDescription')}
      </p>
    );

  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={toPoseImage('POINT')}
        alt=""
        className="size-20 shrink-0 object-contain"
      />
      <div className="min-w-0 flex-1 rounded-2xl rounded-bl-sm bg-secondary px-4 py-3">
        {analysis === 'waiting' ? (
          <div role="status">
            <p className="text-15 leading-6 font-bold break-keep text-foreground">
              {t('waitingDescription')}
            </p>
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
            <p
              role="status"
              className="text-15 leading-6 font-bold break-keep text-foreground"
            >
              {t('expiredDescription')}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 text-sm font-bold text-primary active:opacity-70"
            >
              {t('retryButton')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
