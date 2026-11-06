// 롤플레이 대화 기록 — 그 대화에서 주고받은 말과 교정. 요약이나 지난 대화 목록에서 온다
import { use } from 'react';
import { notFound } from 'next/navigation';

import { RoleplayTranscript } from './_ui/RoleplayTranscript';

export default function RoleplayTranscriptPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { sessionId } = use(params);
  const { from } = use(searchParams);
  const id = Number(sessionId);
  // 손으로 고친 주소가 그대로 조회로 흘러가면 백엔드가 400을 준다
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const fromRoleplayId = Number(from);

  return (
    <RoleplayTranscript
      sessionId={id}
      fromRoleplayId={
        Number.isSafeInteger(fromRoleplayId) && fromRoleplayId > 0
          ? fromRoleplayId
          : undefined
      }
    />
  );
}
