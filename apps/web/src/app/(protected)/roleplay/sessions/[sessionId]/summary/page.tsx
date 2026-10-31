// 오늘의 롤플레이 — 대화를 막 끝내고 보는 요약. 세션이 주인이라 세션 주소 아래에 선다
import { use } from 'react';
import { notFound } from 'next/navigation';

import { RoleplaySummary } from './_ui/RoleplaySummary';

export default function RoleplaySummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  // 대화를 막 끝내고 왔는가 — 그때만 요약 앞에 축하를 띄운다 (routes.roleplaySummaryPath)
  searchParams: Promise<{ celebrate?: string }>;
}) {
  const { sessionId } = use(params);
  const { celebrate } = use(searchParams);
  const id = Number(sessionId);
  // 손으로 고친 주소가 그대로 조회로 흘러가면 백엔드가 400을 준다
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  return <RoleplaySummary sessionId={id} celebrate={celebrate === '1'} />;
}
