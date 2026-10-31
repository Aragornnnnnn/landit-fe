// 그 대화의 표현을 리스트가 그릴 수 있는 모양으로 — 배우는 순서와 잠금은 서버가 안 정해 줘서 여기서 정한다
import type { Expression } from '@/features/expression/api/list';

import type { SmallTalkSessionExpression } from '../api/small-talk';

// 아직 안 배운 것 중 첫 표현만 열고 나머지는 잠근다.
// 이미 배운 표현은 다시 볼 수 있게 열어 둔다
export const toExpressionListItems = (
  expressions: SmallTalkSessionExpression[],
): Expression[] => {
  const next = expressions.find((expression) => !expression.completed);

  return expressions.map((expression) => ({
    ...expression,
    locked:
      !expression.completed && expression.expressionId !== next?.expressionId,
  }));
};

// 서버가 무료 대화로 열어 준 표현인가 — 그런 표현은 페이월 없이 학습으로 보낸다(서버도 같은 근거로 허용한다)
export const isFreeTrialExpression = (
  expressions: SmallTalkSessionExpression[],
  expressionId: number,
) =>
  expressions.some(
    (expression) =>
      expression.expressionId === expressionId && expression.freeTrial === true,
  );
