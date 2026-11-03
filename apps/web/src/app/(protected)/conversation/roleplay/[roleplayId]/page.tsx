// 롤플레이 대화 페이지 — 주소의 시나리오(보관함 id)로 대화를 연다
import { use } from 'react';
import { notFound } from 'next/navigation';

import { RoleplayFlow } from './_ui/RoleplayFlow';

export default function RoleplayTalkPage({
  params,
}: {
  params: Promise<{ roleplayId: string }>;
}) {
  const { roleplayId } = use(params);
  const id = Number(roleplayId);
  // 손으로 고친 주소가 그대로 조회로 흘러가면 백엔드가 400을 준다
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  return <RoleplayFlow roleplayId={id} />;
}
