// 피드백 작성(/mailbox/compose/[feedbackType]) — 고른 유형이 무엇을 물을지 정한다
import { use } from 'react';
import { notFound } from 'next/navigation';

import { readFeedbackType } from '@/features/mailbox/model/feedback-type';
import { FeedbackComposeFlow } from '@/features/mailbox/ui/FeedbackComposeFlow';

export default function FeedbackComposePage({
  params,
}: {
  params: Promise<{ feedbackType: string }>;
}) {
  const { feedbackType } = use(params);
  const type = readFeedbackType(feedbackType);

  // 모르는 유형이면 무엇을 묻는지 없는 화면이 된다
  if (!type) notFound();

  return <FeedbackComposeFlow type={type} />;
}
