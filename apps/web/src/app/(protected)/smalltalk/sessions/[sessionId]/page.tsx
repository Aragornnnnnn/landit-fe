// 지난 스몰톡 한 건 — 그때 만든 표현을 다시 배우러 들어오는 자리
import { use } from 'react';

import { SmallTalkHistoryDetail } from './_ui/SmallTalkHistoryDetail';

export default function SmallTalkHistoryDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  return <SmallTalkHistoryDetail sessionId={Number(sessionId)} />;
}
