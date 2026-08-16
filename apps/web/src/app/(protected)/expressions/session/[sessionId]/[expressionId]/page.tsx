// 스몰톡 표현 학습 라우트 — 학습 화면은 시나리오와 같고, 나갈 때 그 대화의 표현 목록으로 돌아간다
import { use } from 'react';

import { ExpressionFlow } from '@/features/expression/ui/ExpressionFlow';

export default function SmallTalkExpressionPage({
  params,
}: {
  params: Promise<{ sessionId: string; expressionId: string }>;
}) {
  const { sessionId, expressionId } = use(params);

  // key로 표현이 바뀌면 플로우를 새로 마운트한다 — step·입력 상태가 이전 표현에서 새어나오지 않게
  return (
    <ExpressionFlow
      key={expressionId}
      origin={{ kind: 'session', sessionId: Number(sessionId) }}
      expressionId={Number(expressionId)}
    />
  );
}
