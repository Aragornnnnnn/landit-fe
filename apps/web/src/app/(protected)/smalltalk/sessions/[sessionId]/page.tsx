// 지난 스몰톡 한 건 — 그때 만든 표현을 다시 배우러 들어오는 자리
import { use } from 'react';
import { notFound } from 'next/navigation';

import { SmallTalkHistoryDetail } from './_ui/SmallTalkHistoryDetail';

export default function SmallTalkHistoryDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const id = Number(sessionId);
  // 손으로 고친 주소가 그대로 조회로 흘러가면 백엔드가 400을 준다
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  return <SmallTalkHistoryDetail sessionId={id} />;
}
