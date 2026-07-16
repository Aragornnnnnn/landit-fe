// 표현학습 분기 라우트 — 대화 피드백 후 진입점
import { use } from 'react';

import { ExpressionBranch } from '@/features/expression/ui/ExpressionBranch';

export default function ExpressionBranchPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = use(params);
  return <ExpressionBranch scenarioId={Number(scenarioId)} />;
}
