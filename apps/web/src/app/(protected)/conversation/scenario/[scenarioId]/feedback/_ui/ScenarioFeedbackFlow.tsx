'use client';

// 대화 피드백 흐름 — 총평·상세를 보이고, 마치면 재대화는 홈, 잠기지 않는 사람은 표현 분기,
// 무료 사용자는 레벨 분석 → 결과 → 학습 준비를 지나 표현 분기(그 자리에서 페이월)로 넘긴다.
// 대화 라우트가 replace로 넘겨주는 자기 주소의 화면이라, 페이월이 결제 뒤 여기로 돌려보낼 수 있다
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { FeedbackFlow } from '@/features/feedback/ui/FeedbackFlow';
// 가로 import 사유: 피드백이 끝나는 자리가 무료 구간이 끝나는 자리라 여기서 페이월 게이트를 건다
import { usePaywallGate } from '@/features/subscription/model/usePaywallGate';
import {
  scenarioExpressionBranchPath,
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
}

export const ScenarioFeedbackFlow = ({
  scenarioId,
  sessionId,
  title,
  date,
  replay,
}: ScenarioFeedbackFlowProps) => {
  const router = useRouter();
  const paywallGate = usePaywallGate();
  // 피드백 뒤 페이월 전 화면 — 무료 사용자는 레벨 분석·결과·학습 준비를 지난다
  const [postConversation, setPostConversation] = useState(false);

  // 표현 분기로 — 무료 사용자는 여기가 무료 구간이 끝나는 자리라 게이트가 페이월로 보낸다.
  // 방금 끝난 대화가 곧 무료 구간의 그 하나라 서버 값을 기다리지 않는다. 결제하면 표현 분기로 돌아온다
  const expressionBranchPath = scenarioExpressionBranchPath(scenarioId, date);
  const continueToExpressionBranch = () =>
    paywallGate.guard(() => router.replace(expressionBranchPath), {
      entry: 'conversation_finished',
      returnTo: expressionBranchPath,
      conversationJustFinished: true,
      // 페이월로 갈 때도 피드백을 히스토리에서 지운다 — 뒤로가기가 끝난 대화의 피드백으로 돌아오지 않게
      replace: true,
    });

  // 피드백을 다 본 뒤 — 재대화면 홈, 잠기지 않는 사람은 표현 분기, 무료 사용자는 페이월 전 화면부터
  const goAfterFeedback = () => {
    const next = decidePostFeedbackView({
      wasCompleted: replay,
      locked: paywallGate.locksAfterConversation,
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
      onExit={goAfterFeedback}
    />
  );
};
