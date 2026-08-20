// 내가 보낸 피드백 한 통 — 답장이 도착했으면 그 아래에 붙는다
import { use } from 'react';
import { notFound } from 'next/navigation';

import { SentFeedbackFlow } from '@/features/mailbox/ui/LetterDetailFlow';

export default function SentFeedbackPage({
  params,
}: {
  params: Promise<{ feedbackId: string }>;
}) {
  const { feedbackId } = use(params);

  if (!/^\d+$/.test(feedbackId)) notFound();

  return <SentFeedbackFlow feedbackId={Number(feedbackId)} />;
}
