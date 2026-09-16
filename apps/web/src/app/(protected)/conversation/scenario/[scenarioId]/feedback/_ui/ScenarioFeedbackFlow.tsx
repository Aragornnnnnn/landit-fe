'use client';

// 대화 피드백 흐름 — 총평·상세를 보이고, 마치면 재대화는 홈, 잠기지 않는 사람은 표현 분기,
// 무료 사용자는 첫 시나리오에서만 레벨 분석 → 결과 → 학습 준비를 지나 표현 분기(그 자리에서 페이월)로 넘긴다.
// 서버가 상세를 잠근 세션은 총평의 상세 보기가 페이월로 이어지고, 결제하면 이 주소의 상세로 돌아온다
import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import {
  sessionFeedbackKey,
  useSessionFeedbackQuery,
} from '@/features/feedback/model/useSessionFeedbackQuery';
import { FeedbackFlow } from '@/features/feedback/ui/FeedbackFlow';
// 가로 import 사유: 피드백이 끝나는 자리가 무료 구간이 끝나는 자리라 여기서 페이월 게이트를 건다
import { usePaywallGate } from '@/features/subscription/model/usePaywallGate';
import { useSubscriptionQuery } from '@/features/subscription/model/useSubscriptionQuery';
import { track } from '@/shared/analytics';
import {
  paywallPath,
  scenarioExpressionBranchPath,
  scenarioFeedbackPath,
  scenarioReturnPath,
} from '@/shared/lib/routes';

import { decidePostFeedbackView } from '../_model/post-feedback-view';
import { PostConversationFlow } from './PostConversationFlow';

interface ScenarioFeedbackFlowProps {
  scenarioId: number;
  // 세션 시작이 실패한 대화면 null — 피드백 없이 다음으로 보낸다
  sessionId: number | null;
  title: string;
  // 어느 날 카드에서 온 대화인지. 나갈 때 그 날로 돌려보낸다
  date?: string;
  // 재대화였는지 — 대화 진입 시점 값이라 주소로 받는다. 재대화는 피드백만 보고 홈으로 간다
  replay: boolean;
  // 총평을 건너뛰고 상세부터 — 상세가 잠겨 페이월로 갔다가 결제하고 돌아온 길
  openDetail: boolean;
}

export const ScenarioFeedbackFlow = ({
  scenarioId,
  sessionId,
  title,
  date,
  replay,
  openDetail,
}: ScenarioFeedbackFlowProps) => {
  const router = useRouter();
  const paywallGate = usePaywallGate();
  // 피드백 화면과 같은 키를 읽는다 — 서버가 이 세션의 상세를 잠갔는지가 피드백 뒤 갈 곳을 가른다
  const { feedback } = useSessionFeedbackQuery(sessionId);
  // 피드백 뒤 페이월 전 화면 — 무료 사용자의 첫 시나리오는 레벨 분석·결과·학습 준비를 지난다
  const [postConversation, setPostConversation] = useState(false);

  // 유료인데 잠긴 응답을 들고 있다 — 무료일 때 받아 둔 것이다. 이 화면에서 한 번 다시 받는다.
  // 결제하고 돌아온 길, 복원, 다른 기기에서 결제한 뒤 앱을 켠 길이 전부 여기로 모인다.
  // 한 번만이다 — 다시 받아도 잠겨 있으면(웹훅 지연) 그대로 두고, CTA는 페이월(구매 복원)로 이어진다
  const { subscription } = useSubscriptionQuery();
  const queryClient = useQueryClient();
  const staleLocked =
    subscription?.premium === true && feedback?.detailFeedbackLocked === true;
  const refreshed = useRef(false);
  useEffect(() => {
    if (!staleLocked || refreshed.current || sessionId === null) return;
    refreshed.current = true;
    void queryClient.invalidateQueries({
      queryKey: sessionFeedbackKey(sessionId),
    });
  }, [staleLocked, sessionId, queryClient]);

  // 표현 분기로 — 무료 사용자는 여기가 첫 시나리오의 무료 구간이 끝나는 자리라 게이트가 페이월로 보낸다. 결제하면 표현 분기로 돌아온다
  const expressionBranchPath = scenarioExpressionBranchPath(scenarioId, date);
  const continueToExpressionBranch = () =>
    paywallGate.guard(() => router.replace(expressionBranchPath), {
      entry: 'conversation_finished',
      returnTo: expressionBranchPath,
      // 페이월로 갈 때도 피드백을 히스토리에서 지운다 — 뒤로가기가 끝난 대화의 피드백으로 돌아오지 않게
      replace: true,
    });

  // 잠긴 상세를 보려 했다 — 페이월로. 결제하면 이 주소의 상세로 돌아온다.
  // 게이트의 환경 판정을 타지 않는다. 서버가 이미 상세를 비워 보냈으니 어느 환경이든 보여줄 게 없다
  const openPaywallForDetail = () => {
    track(EVENTS.PAYWALL_GATE_LOCKED, { entry: 'feedback_detail' });
    router.push(
      paywallPath({
        from: scenarioFeedbackPath(scenarioId, {
          session: sessionId,
          date,
          replay,
          detail: true,
        }),
      }),
    );
  };

  // 피드백을 다 본 뒤 — 재대화면 홈, 잠기지 않는 사람은 표현 분기, 무료 사용자는 첫 시나리오만 페이월 전 화면부터
  const goAfterFeedback = () => {
    const next = decidePostFeedbackView({
      replay,
      learningLocked: paywallGate.locked,
      // 필드가 없는 구버전 응답은 열린 것으로(그 BE는 대화 자체를 하나로 막는다),
      // 응답 자체를 못 받았으면 잠긴 것으로 본다 — 둘째 시나리오에서 레벨 화면이 또 뜨는 쪽이 더 나쁘다
      detailFeedbackLocked: feedback
        ? (feedback.detailFeedbackLocked ?? false)
        : true,
    });
    if (next === 'home') router.replace(scenarioReturnPath({ date }));
    else if (next === 'branch') continueToExpressionBranch();
    else setPostConversation(true);
  };

  if (postConversation) {
    return (
      <PostConversationFlow
        sessionId={sessionId}
        scenarioId={scenarioId}
        onFinish={continueToExpressionBranch}
      />
    );
  }

  // 첫 화면의 페이드는 라우트 전환이 맡는다 — 같은 라우트 안에서 대화 → 피드백을 넘기던 래퍼는 필요 없어졌다
  return (
    <FeedbackFlow
      sessionId={sessionId}
      title={title}
      openDetail={openDetail}
      onExit={goAfterFeedback}
      onDetailLocked={openPaywallForDetail}
    />
  );
};
