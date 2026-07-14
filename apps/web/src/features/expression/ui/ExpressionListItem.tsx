'use client';

// 표현 리스트 항목 — 완료(초록 체크) / 학습중(강조 카드) / 잠금(회색) 상태를 그린다
import { CheckIcon, LockIcon } from '@/shared/ui/Icons';

import type { Expression } from '../api/list';

interface ExpressionListItemProps {
  expression: Expression;
  onSelect: (expressionId: number) => void;
}

export const ExpressionListItem = ({
  expression,
  onSelect,
}: ExpressionListItemProps) => {
  const {
    expressionId,
    displayOrder,
    completed,
    locked,
    targetExpressionText,
    baseExpressionMeaningText,
  } = expression;

  if (locked) {
    return (
      <div className="flex items-center gap-3 px-2 py-3.5 opacity-60">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <LockIcon size={15} />
        </span>
        <p className="text-base font-bold text-muted-foreground">
          {baseExpressionMeaningText}
        </p>
      </div>
    );
  }

  if (completed) {
    return (
      <button
        onClick={() => onSelect(expressionId)}
        className="flex w-full items-center gap-3 px-2 py-3.5 text-left"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
          <CheckIcon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-foreground">
            {baseExpressionMeaningText}
          </p>
          <p className="truncate text-sm font-medium text-muted-foreground">
            {targetExpressionText}
          </p>
        </div>
        <span className="shrink-0 text-sm font-medium text-muted-foreground">
          완료
        </span>
      </button>
    );
  }

  // 학습 중 — 다음에 배울 표현
  return (
    <button
      onClick={() => onSelect(expressionId)}
      className="flex w-full items-center gap-3 rounded-2xl border-2 border-primary bg-primary/5 px-3 py-4 text-left"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {displayOrder}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold text-foreground">
          {baseExpressionMeaningText}
        </p>
        <p className="text-sm font-medium text-primary">오늘 배울 표현</p>
      </div>
      <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
        학습 중
      </span>
    </button>
  );
};
