'use client';

// 오늘의 롤플레이 — 막 끝낸 대화를 지난번과 비교해 보여준다. 스몰톡 요약과 같은 카드를 쓰되 다음 대화 질문이 없다.
// 막 끝내고 왔으면 오늘 열매가 찍히는 축하를 먼저 잠깐 보여 준다 — 그동안 요약은 뒤에서 받는다.
// 나가는 길은 상세 피드백(대화 기록) 하나, 닫기(X)는 롤플레이 탭으로 간다. 표현 학습으로는 이어지지 않는다
import { useEffect, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { PageHeader } from '@/app/(protected)/_ui/PageHeader';
import {
  CELEBRATE_MS,
  CelebrateStage,
} from '@/features/expression/ui/ExpressionStages';
import { GrowthCard } from '@/features/feedback/ui/GrowthCard';
import { ReusedExpressionsCard } from '@/features/feedback/ui/ReusedExpressionsCard';
import { useRoleplaySummaryQuery } from '@/features/roleplay/model/useRoleplaySummaryQuery';
import { toSummaryBlocks } from '@/features/small-talk/model/summary-blocks';
import { BlockSkeleton } from '@/features/small-talk/ui/BlockSkeleton';
import { ComparisonCard } from '@/features/small-talk/ui/ComparisonCard';
import { SummaryHeadline } from '@/features/small-talk/ui/SummaryHeadline';
import { SummarySkeleton } from '@/features/small-talk/ui/SummarySkeleton';
import { track } from '@/shared/analytics';
import { ROLEPLAY_PATH, roleplayTranscriptPath } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { CloseIcon } from '@/shared/ui/Icons';

interface RoleplaySummaryProps {
  sessionId: number;
  // 대화를 막 끝내고 왔는가 — 다시 들어온 길이면 축하하지 않는다
  celebrate: boolean;
}

export const RoleplaySummary = ({
  sessionId,
  celebrate,
}: RoleplaySummaryProps) => {
  const router = useRouter();
  const t = useTranslations('roleplay.summary');
  const tCommon = useTranslations('common');
  const { summary, error, isLoading, waitExpired, retry } =
    useRoleplaySummaryQuery(sessionId);
  const [celebrating, setCelebrating] = useState(celebrate);
  useEffect(() => {
    if (!celebrate) return;
    const timer = setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    return () => clearTimeout(timer);
  }, [celebrate]);

  // 총평은 이 세션의 교정이 다 끝나야 계산된다 — 상한까지 안 오면 붙잡아 두지 않는다
  const summaryStuck = summary !== null && summary.pending && waitExpired;
  const blocks =
    summary && !summary.pending ? toSummaryBlocks(summary, waitExpired) : null;

  // 떠나는 길은 한 번만 간다 — 다음 화면이 뜨기 전에 또 누르면 두 번 이동한다
  const [leaving, setLeaving] = useState(false);
  const leaveTo = (to: string) => {
    if (leaving) return;
    setLeaving(true);
    router.replace(to);
  };
  const goHome = () => leaveTo(ROLEPLAY_PATH);

  if (celebrating) {
    return (
      <main
        className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
        style={{ paddingTop: 'var(--safe-area-inset-top)' }}
      >
        <header className="flex h-14 flex-none items-center px-3">
          <button
            onClick={goHome}
            className="flex size-10 items-center justify-center text-muted-foreground"
            aria-label={tCommon('closeLabel')}
          >
            <CloseIcon size={22} />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col px-6 pb-[max(var(--safe-area-inset-bottom),24px)]">
          <AnimatePresence mode="wait">
            <CelebrateStage key="celebrate" />
          </AnimatePresence>
        </div>
      </main>
    );
  }

  return (
    <main
      className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      style={{ paddingTop: 'var(--safe-area-inset-top)' }}
    >
      <PageHeader
        title={t('title')}
        leading="close"
        backDisabled={leaving}
        onBack={goHome}
      />

      {error || summaryStuck ? (
        <div
          role="alert"
          className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            {error?.message || t('unavailableError')}
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="w-auto px-6"
            onClick={() => {
              track(EVENTS.ERROR_RETRIED, { screen: 'roleplay_summary' });
              retry();
            }}
          >
            {t('retryButton')}
          </Button>
          <button
            onClick={goHome}
            className="py-1 text-sm font-semibold text-muted-foreground active:opacity-70"
          >
            {t('homeButton')}
          </button>
        </div>
      ) : isLoading || !summary || !summary.headline || !summary.comparison ? (
        <SummarySkeleton label={t('loadingLabel')} />
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-1 pb-6">
            <SummaryHeadline headline={summary.headline} />
            <ComparisonCard comparison={summary.comparison} />
            {blocks?.growth.kind === 'ready' && (
              <GrowthCard growth={blocks.growth.data} />
            )}
            {blocks?.reusedExpressions.kind === 'ready' && (
              <ReusedExpressionsCard items={blocks.reusedExpressions.data} />
            )}
            {blocks?.reusedExpressions.kind === 'loading' && (
              <BlockSkeleton label={t('reusedLoadingLabel')} />
            )}
          </div>

          <footer className="flex-none px-5 pt-3 pb-[max(var(--safe-area-inset-bottom),16px)]">
            <Button
              onClick={() => leaveTo(roleplayTranscriptPath(sessionId))}
              disabled={leaving}
            >
              {t('detailButton')}
            </Button>
          </footer>
        </>
      )}
    </main>
  );
};
