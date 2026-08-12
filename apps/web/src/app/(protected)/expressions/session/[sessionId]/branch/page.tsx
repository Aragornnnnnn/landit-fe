// 스몰톡 대화 직후 라우트 — 표현의 출처가 그 대화(세션)라 주소에도 세션이 선다
import { use } from 'react';

import { SmallTalkResult } from './_ui/SmallTalkResult';

export default function SmallTalkResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  return <SmallTalkResult sessionId={Number(sessionId)} />;
}
