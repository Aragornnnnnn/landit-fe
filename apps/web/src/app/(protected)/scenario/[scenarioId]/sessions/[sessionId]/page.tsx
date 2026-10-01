'use client';

// 시나리오 기록의 한 회차 — 주소에서 시나리오·세션·보던 날·상세부터 열지를 읽어 조립만 한다
import { Suspense, use } from 'react';
import { notFound, useSearchParams } from 'next/navigation';

import { FeedbackSkeleton } from '@/features/feedback/ui/flow/FeedbackSkeleton';
import { readScenarioSessionParams } from '@/shared/lib/routes';

import { ScenarioSessionFeedback } from './_ui/ScenarioSessionFeedback';

const toId = (value: string) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// useSearchParams는 프리렌더 시 Suspense 경계가 필요하다
export default function ScenarioSessionPage({
  params,
}: {
  params: Promise<{ scenarioId: string; sessionId: string }>;
}) {
  return (
    <Suspense fallback={<FeedbackSkeleton />}>
      <ScenarioSessionContent params={params} />
    </Suspense>
  );
}

function ScenarioSessionContent({
  params,
}: {
  params: Promise<{ scenarioId: string; sessionId: string }>;
}) {
  const { scenarioId, sessionId } = use(params);
  const ids = { scenario: toId(scenarioId), session: toId(sessionId) };
  // 손으로 고친 주소가 그대로 조회로 흘러가면 백엔드가 400을 준다
  if (ids.scenario === null || ids.session === null) notFound();
  const { date, detail } = readScenarioSessionParams(useSearchParams());

  return (
    <ScenarioSessionFeedback
      scenarioId={ids.scenario}
      sessionId={ids.session}
      date={date}
      openDetail={detail}
    />
  );
}
