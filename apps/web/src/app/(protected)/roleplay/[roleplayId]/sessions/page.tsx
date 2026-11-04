// 롤플레이 시나리오 하나로 한 지난 대화 — 카드 ⋯의 「지난 대화 보기」로 들어온다
import { use } from 'react';
import { notFound } from 'next/navigation';

import { RoleplaySessionList } from './_ui/RoleplaySessionList';

export default function RoleplaySessionsPage({
  params,
}: {
  params: Promise<{ roleplayId: string }>;
}) {
  const { roleplayId } = use(params);
  const id = Number(roleplayId);
  // 손으로 고친 주소가 그대로 조회로 흘러가지 않게
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  return <RoleplaySessionList roleplayId={id} />;
}
