'use client';

// 시나리오 기록의 한 회차 — 그때 받은 총평·상세를 다시 보고, 대화 직후 흐름 없이 기록 목록으로 돌아간다
import { useEffect, useRef } from 'react';
import { EVENTS } from '@landit/analytics';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { isStaleLockedFeedback } from '@/features/feedback/model/feedback-view';
import { FeedbackContent } from '@/features/feedback/ui/flow/FeedbackContent';
import { FeedbackNotice } from '@/features/feedback/ui/flow/FeedbackNotice';
import { FeedbackSkeleton } from '@/features/feedback/ui/flow/FeedbackSkeleton';
import { useScenarioTitle } from '@/features/scenario/model/useScenarioTitle';
// 가로 import 사유: 결제하고 돌아온 사람에게 잠긴 옛 기록을 다시 받아 풀린 상세를 보여 준다
import { useSubscriptionQuery } from '@/features/subscription/model/my-subscription/useSubscriptionQuery';
import { track } from '@/shared/analytics';
import {
  paywallPath,
  scenarioSessionPath,
  scenarioSessionsPath,
} from '@/shared/lib/routes';
import { RetryNotice } from '@/shared/ui/RetryNotice';

import { useScenarioHistoryQuery } from '../../_model/useScenarioHistoryQuery';

interface ScenarioSessionFeedbackProps {
  scenarioId: number;
  sessionId: number;
  date?: string;
  /** 총평을 건너뛰고 상세부터 — 잠긴 상세를 결제하러 갔다가 돌아온 길 */
  openDetail: boolean;
}

export const ScenarioSessionFeedback = ({
  scenarioId,
  sessionId,
  date,
  openDetail,
}: ScenarioSessionFeedbackProps) => {
  const router = useRouter();
  const t = useTranslations('feedback.feedbackView');
  const tSession = useTranslations('scenario.sessionFeedback');
  const title = useScenarioTitle(scenarioId, date, t('fallbackTitle'));
  const { sessions, error, retry, isRefreshing } =
    useScenarioHistoryQuery(scenarioId);
  const session = sessions?.find((item) => item.sessionId === sessionId);
  const feedback = session?.feedback ?? null;
  const backToList = () =>
    router.replace(scenarioSessionsPath(scenarioId, date));

  // 유료인데 잠긴 기록을 들고 있으면 한 번만 다시 받는다 — 대화 직후 피드백과 같은 규칙
  const { subscription } = useSubscriptionQuery();
  const staleLocked = isStaleLockedFeedback(subscription?.premium, feedback);
  const refreshed = useRef(false);
  useEffect(() => {
    if (!staleLocked || refreshed.current) return;
    refreshed.current = true;
    retry();
  }, [staleLocked, retry]);

  // 잠긴 상세는 페이월로, 결제하면 이 회차의 상세로 돌아온다 (source를 대화 직후와 같게 둔 이유는 docs/analytics.md)
  const openPaywallForDetail = () => {
    track(EVENTS.PAYWALL_GATE_LOCKED, { source: 'feedback_detail' });
    router.push(
      paywallPath({
        source: 'feedback_detail',
        from: scenarioSessionPath(scenarioId, sessionId, {
          date,
          detail: true,
        }),
      }),
    );
  };

  // 받아 둔 기록이 있으면 다시 받다 실패해도 보던 피드백을 그대로 둔다
  if (sessions === null && error) {
    return (
      <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
        <RetryNotice
          screen="scenario_history"
          message={error.message || tSession('loadError')}
          onRetry={retry}
        />
      </main>
    );
  }
  if (sessions === null) return <FeedbackSkeleton />;
  if (!session || !feedback) {
    return (
      <FeedbackNotice
        message={
          session ? tSession('noFeedbackError') : tSession('notFoundError')
        }
        actionLabel={tSession('backButton')}
        onAction={backToList}
      />
    );
  }

  return (
    <FeedbackContent
      feedback={feedback}
      title={title}
      source="history"
      premium={subscription?.premium ?? false}
      openDetail={openDetail}
      refreshing={isRefreshing}
      onExit={backToList}
      onDetailLocked={openPaywallForDetail}
    />
  );
};
