'use client';

// 시나리오 기록의 한 회차 — 그때 받은 총평·상세를 다시 본다. 대화 직후 흐름(표현 분기·페이월·레벨 분석)으로 이어지지 않고,
// 나가면 기록 목록으로 돌아간다. 잠긴 상세는 페이월로, 결제하면 이 회차로 돌아온다
import { useEffect, useRef } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { isStaleLockedFeedback } from '@/features/feedback/model/feedback-view';
import { FeedbackContent } from '@/features/feedback/ui/flow/FeedbackContent';
import { FeedbackSkeleton } from '@/features/feedback/ui/flow/FeedbackSkeleton';
import { useScenarioTitle } from '@/features/scenario/model/useScenarioTitle';
// 가로 import 사유: 결제하고 돌아온 사람에게 잠긴 옛 기록을 다시 받아 풀린 상세를 보여 준다
import { useSubscriptionQuery } from '@/features/subscription/model/useSubscriptionQuery';
import { track } from '@/shared/analytics';
import {
  paywallPath,
  scenarioSessionPath,
  scenarioSessionsPath,
} from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';

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
  const title = useScenarioTitle(scenarioId, date, '대화 피드백');
  const { sessions, error, retry, isRefreshing } =
    useScenarioHistoryQuery(scenarioId);
  const session = sessions?.find((item) => item.sessionId === sessionId);
  const feedback = session?.feedback ?? null;
  const backToList = () =>
    router.replace(scenarioSessionsPath(scenarioId, date));

  // 유료인데 잠긴 기록을 들고 있다 — 무료일 때 받아 둔 것이다. 한 번만 다시 받는다 (대화 직후 피드백과 같은 규칙)
  const { subscription } = useSubscriptionQuery();
  const staleLocked = isStaleLockedFeedback(subscription?.premium, feedback);
  const refreshed = useRef(false);
  useEffect(() => {
    if (!staleLocked || refreshed.current) return;
    refreshed.current = true;
    retry();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 잠긴 응답을 알아챈 순간 한 번만
  }, [staleLocked]);

  // 잠긴 상세를 보려 했다 — 페이월로. 결제하면 이 회차의 상세로 돌아온다
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
      <SessionNotice message={error.message || '기록을 불러오지 못했어요.'}>
        <Button
          variant="secondary"
          size="sm"
          className="w-auto px-6"
          onClick={() => {
            track(EVENTS.ERROR_RETRIED, { screen: 'scenario_history' });
            retry();
          }}
        >
          다시 시도
        </Button>
      </SessionNotice>
    );
  }
  if (sessions === null) return <FeedbackSkeleton />;
  if (!session || !feedback) {
    return (
      <SessionNotice
        message={
          session
            ? '이 대화는 저장된 피드백이 없어요.'
            : '이 대화를 찾지 못했어요.'
        }
      >
        <Button className="w-auto px-8" onClick={backToList}>
          기록으로
        </Button>
      </SessionNotice>
    );
  }

  return (
    <FeedbackContent
      feedback={feedback}
      title={title}
      source="history"
      openDetail={openDetail}
      refreshing={isRefreshing}
      onExit={backToList}
      onDetailLocked={openPaywallForDetail}
    />
  );
};

// 보여 줄 피드백이 없을 때 — 무엇이 없는지 말하고 나갈 길을 하나 준다
const SessionNotice = ({
  message,
  children,
}: {
  message: string;
  children: React.ReactNode;
}) => (
  <main className="mx-auto flex h-dvh max-w-[430px] flex-col items-center justify-center gap-6 bg-background px-6">
    <p className="text-center text-base font-medium text-muted-foreground">
      {message}
    </p>
    {children}
  </main>
);
