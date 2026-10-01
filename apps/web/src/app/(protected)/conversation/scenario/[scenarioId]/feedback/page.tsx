'use client';

// 대화 피드백 페이지 — 대화가 끝나면 replace로 넘어온다. 어느 세션·어느 날·재대화였는지를 주소에서 읽어 피드백 흐름을 조립한다
import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';

import { FEEDBACK_FALLBACK_TITLE } from '@/features/feedback/model/feedback-view';
import { FeedbackSkeleton } from '@/features/feedback/ui/flow/FeedbackSkeleton';
import { useScenarioTitle } from '@/features/scenario/model/useScenarioTitle';
import { readScenarioFeedbackParams } from '@/shared/lib/routes';

import { ScenarioFeedbackFlow } from './_ui/ScenarioFeedbackFlow';

// useSearchParams는 프리렌더 시 Suspense 경계가 필요하다
export default function ScenarioFeedbackPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  return (
    <Suspense fallback={<FeedbackSkeleton />}>
      <ScenarioFeedbackContent params={params} />
    </Suspense>
  );
}

function ScenarioFeedbackContent({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = use(params);
  const id = Number(scenarioId);
  const { session, date, replay, detail } =
    readScenarioFeedbackParams(useSearchParams());
  const title = useScenarioTitle(id, date, FEEDBACK_FALLBACK_TITLE);

  return (
    <ScenarioFeedbackFlow
      scenarioId={id}
      sessionId={session}
      title={title}
      date={date}
      replay={replay}
      openDetail={detail}
    />
  );
}
