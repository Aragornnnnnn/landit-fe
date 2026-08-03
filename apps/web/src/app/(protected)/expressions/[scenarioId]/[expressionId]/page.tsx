'use client';

// 표현학습 플로우 페이지 — 한 표현의 영작~복습 스텝을 렌더한다
import { use } from 'react';

import { ExpressionFlow } from '@/features/expression/ui/ExpressionFlow';

export default function ExpressionFlowPage({
  params,
  searchParams,
}: {
  params: Promise<{ scenarioId: string; expressionId: string }>;
  // 지난 날 카드에서 들어왔으면 그 날짜가 실려 온다
  searchParams: Promise<{ date?: string }>;
}) {
  const { scenarioId, expressionId } = use(params);
  const { date } = use(searchParams);

  // key로 표현이 바뀌면 플로우를 새로 마운트한다 — step·입력 상태가 이전 표현에서 새어나오지 않게
  return (
    <ExpressionFlow
      key={expressionId}
      scenarioId={Number(scenarioId)}
      expressionId={Number(expressionId)}
      date={date}
    />
  );
}
