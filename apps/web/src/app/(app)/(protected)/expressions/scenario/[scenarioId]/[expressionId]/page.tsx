'use client';

// 시나리오 표현 학습 라우트 — 한 표현의 영작~복습 스텝을 렌더한다
import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';

import { ExpressionFlow } from '@/features/expression/ui/ExpressionFlow';
import { QuizStepSkeleton } from '@/features/expression/ui/QuizStepSkeleton';
import { readDateParam } from '@/shared/lib/routes';

import { usePremiumPreview } from '../../../../_model/usePremiumPreview';

// useSearchParams는 프리렌더 시 Suspense 경계가 필요하다
export default function ExpressionFlowPage({
  params,
}: {
  params: Promise<{ scenarioId: string; expressionId: string }>;
}) {
  return (
    <Suspense fallback={<QuizStepSkeleton />}>
      <ExpressionFlowContent params={params} />
    </Suspense>
  );
}

function ExpressionFlowContent({
  params,
}: {
  params: Promise<{ scenarioId: string; expressionId: string }>;
}) {
  const { scenarioId, expressionId } = use(params);
  // 지난 날 카드에서 들어왔으면 그 날짜가 실려 온다.
  // searchParams prop은 앱 안에서 이동할 때 갱신되지 않아 훅으로 읽는다
  const date = readDateParam(useSearchParams());
  // 프리미엄 프리뷰의 무료 표현이면 끝나자마자 페이월로 — 목록(나머지는 잠김)으로 돌아가지 않는다
  const { onFreeExpressionFinished } = usePremiumPreview();

  // key로 표현이 바뀌면 플로우를 새로 마운트한다 — step·입력 상태가 이전 표현에서 새어나오지 않게
  return (
    <ExpressionFlow
      key={expressionId}
      origin={{ kind: 'scenario', scenarioId: Number(scenarioId), date }}
      expressionId={Number(expressionId)}
      onFinished={onFreeExpressionFinished}
    />
  );
}
