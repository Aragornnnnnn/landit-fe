// 편지 상세(/mailbox/[letterId]) — 받은 편지와 보낸 편지가 한 라우트를 쓴다
import { use } from 'react';
import { notFound } from 'next/navigation';

import { LetterDetailFlow } from '@/features/mailbox/ui/LetterDetailFlow';

export default function LetterDetailPage({
  params,
}: {
  params: Promise<{ letterId: string }>;
}) {
  const { letterId } = use(params);

  // 손으로 고친 주소가 그대로 조회로 흘러가면 백엔드가 400을 준다.
  // Number()로 재면 1e3·0x10·공백까지 통과해 이상한 주소가 그대로 요청이 된다
  if (!/^\d+$/.test(letterId)) notFound();

  return <LetterDetailFlow letterId={Number(letterId)} />;
}
