// 표현학습 분기 라우트 — 대화 피드백 후 진입점
import { use } from 'react';

import { ExpressionBranch } from '@/features/expression/ui/list/ExpressionBranch';
import { readDateParam } from '@/shared/lib/routes';

export default function ExpressionBranchPage({
  params,
  searchParams,
}: {
  params: Promise<{ scenarioId: string }>;
  // 지난 날 카드에서 온 대화였으면 그 날짜가 실려 온다
  searchParams: Promise<{ date?: string }>;
}) {
  const { scenarioId } = use(params);
  const { date } = use(searchParams);
  return (
    <ExpressionBranch
      scenarioId={Number(scenarioId)}
      date={readDateParam(new URLSearchParams(date ? { date } : {}))}
    />
  );
}
