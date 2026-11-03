// 롤플레이 대화 기록 — 그 대화에서 주고받은 말과 교정. 요약 다음 화면이다
import { use } from 'react';
import { notFound } from 'next/navigation';

import { RoleplayTranscript } from './_ui/RoleplayTranscript';

export default function RoleplayTranscriptPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const id = Number(sessionId);
  // 손으로 고친 주소가 그대로 조회로 흘러가면 백엔드가 400을 준다
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  return <RoleplayTranscript sessionId={id} />;
}
