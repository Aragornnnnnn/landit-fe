'use client';

// 대화 피드백 페이지 — 대화가 끝나면 replace로 넘어온다. 어느 세션·어느 날·재대화였는지를 주소에서 읽어 피드백 흐름을 조립한다
import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';

import { FeedbackSkeleton } from '@/features/feedback/ui/flow/FeedbackSkeleton';
import { useDailyScenarioQuery } from '@/features/scenario/model/useDailyScenarioQuery';
import { readScenarioFeedbackParams } from '@/shared/lib/routes';

import { ScenarioFeedbackFlow } from './_ui/ScenarioFeedbackFlow';

// 그 날 카드가 이 시나리오가 아닐 때 헤더에 쓰는 제목 — 자정을 넘겨 끝낸 대화가 여기 걸린다.
// 대화 화면과 달리 막지 않는다. 피드백은 세션 것이라 카드가 안 맞아도 보여줄 수 있다
const FALLBACK_TITLE = '대화 피드백';

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
  const { session, date, replay } =
    readScenarioFeedbackParams(useSearchParams());

  // 제목은 그 날 카드에서 — 대화 화면이 같은 키로 받아 둔 캐시라 보통 즉시 있다.
  // 없어도 기다리지 않는다. 제목 하나 때문에 피드백을 막을 이유가 없고, 오면 그때 갈아끼운다
  const { daily } = useDailyScenarioQuery(date);
  const card = daily?.scenario;
  const title =
    card && card.scenarioId === id ? card.scenarioTitle : FALLBACK_TITLE;

  return (
    <ScenarioFeedbackFlow
      scenarioId={id}
      sessionId={session}
      title={title}
      date={date}
      replay={replay}
    />
  );
}
