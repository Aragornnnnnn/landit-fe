'use client';

// 시나리오 기록 목록 — 탭바 없는 전체 화면이라 탭 그룹 밖에 둔다. 주소에서 시나리오와 보던 날을 읽어 조립만 한다
import { Suspense, use } from 'react';
import { notFound, useSearchParams } from 'next/navigation';

import { readDateParam } from '@/shared/lib/routes';

import { ScenarioSessionList } from './_ui/ScenarioSessionList';

// useSearchParams는 프리렌더 시 Suspense 경계가 필요하다
export default function ScenarioSessionsPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  return (
    <Suspense>
      <ScenarioSessionsContent params={params} />
    </Suspense>
  );
}

function ScenarioSessionsContent({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = use(params);
  const id = Number(scenarioId);
  // 손으로 고친 주소가 그대로 조회로 흘러가면 백엔드가 400을 준다
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const date = readDateParam(useSearchParams());

  return <ScenarioSessionList scenarioId={id} date={date} />;
}
