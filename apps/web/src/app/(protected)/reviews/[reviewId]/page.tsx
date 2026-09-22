'use client';

// 푸시 복습 라우트 — 알림의 딥링크로만 들어온다(앱 메뉴에는 진입점이 없다)
import { use } from 'react';

import { ReviewFlow } from '@/features/review/ui/ReviewFlow';

export default function ReviewPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = use(params);

  return <ReviewFlow key={reviewId} reviewId={reviewId} />;
}
