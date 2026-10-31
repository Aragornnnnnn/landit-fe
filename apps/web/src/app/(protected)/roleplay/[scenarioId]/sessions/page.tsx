// 롤플레이 시나리오 하나로 한 지난 대화 — 카드 ⋯의 「지난 대화 보기」로 들어온다
import { use } from 'react';
import { notFound } from 'next/navigation';

import { RoleplaySessions } from './_ui/RoleplaySessions';

export default function RoleplaySessionsPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = use(params);
  const id = Number(scenarioId);
  // 손으로 고친 주소가 그대로 조회로 흘러가지 않게
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  return <RoleplaySessions scenarioId={id} />;
}
