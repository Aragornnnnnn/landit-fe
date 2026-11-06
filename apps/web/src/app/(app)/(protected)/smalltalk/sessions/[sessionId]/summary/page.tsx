// 오늘의 스몰톡 — 대화를 막 끝내고 보는 요약. 세션이 주인이라 기록 주소 아래에 선다
import { use } from 'react';
import { notFound } from 'next/navigation';

import { SmallTalkSummary } from './_ui/SmallTalkSummary';

export default function SmallTalkSummaryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const id = Number(sessionId);
  // 손으로 고친 주소가 그대로 조회로 흘러가면 백엔드가 400을 준다
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  return <SmallTalkSummary sessionId={id} />;
}
