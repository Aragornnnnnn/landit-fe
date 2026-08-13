// 그날 주고받은 말 다시 보기 — 상세와 같은 응답을 쓰므로 새로 받아오지 않는다
import { use } from 'react';

import { SmallTalkTranscript } from './_ui/SmallTalkTranscript';

export default function SmallTalkTranscriptPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  return <SmallTalkTranscript sessionId={Number(sessionId)} />;
}
