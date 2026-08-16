// 그날 주고받은 말 다시 보기 — 상세와 같은 응답을 쓰므로 새로 받아오지 않는다
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
