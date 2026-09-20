// 그날 주고받은 말 다시 보기 — 상세와 같은 응답(캐시)을 이어 쓰되, 교정이 준비될 때까지는 다시 묻는다
import { use } from 'react';
import { notFound } from 'next/navigation';

import { SmallTalkTranscript } from './_ui/SmallTalkTranscript';

export default function SmallTalkTranscriptPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const id = Number(sessionId);
  // 손으로 고친 주소가 그대로 조회로 흘러가면 백엔드가 400을 준다
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  return <SmallTalkTranscript sessionId={id} />;
}
