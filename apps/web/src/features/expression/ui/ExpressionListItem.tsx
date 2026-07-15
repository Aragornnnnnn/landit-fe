'use client';

// 표현 리스트 항목 — 완료(연녹색 체크) / 시작할 표현(강조 카드) / 잠금(회색) 상태를 그린다
import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

import { CheckIcon, ChevronRightIcon, LockIcon } from '@/shared/ui/Icons';

import type { Expression } from '../api/list';

interface ExpressionListItemProps {
  expression: Expression;
  onSelect: (expressionId: number) => void;
  // 방금 해금돼 강조·스크롤 대상인지 (활성 항목에만 켜진다)
  highlight?: boolean;
  // 활성 항목의 '시작할게요' 알약을 숨긴다
  hideStartAction?: boolean;
}

export const ExpressionListItem = ({
  expression,
  onSelect,
  highlight = false,
  hideStartAction = false,
}: ExpressionListItemProps) => {
  const {
    expressionId,
    displayOrder,
    completed,
    locked,
    targetExpressionText,
    baseExpressionMeaningText,
  } = expression;

  // 해금 직후엔 이 항목으로 부드럽게 스크롤한다 (활성 카드에만 ref가 붙는다)
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (highlight) {
      ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [highlight]);

  if (locked) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-secondary/40 px-3.5 py-3.5 opacity-60">
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
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3.5 text-left shadow-sm transition-colors active:bg-secondary"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
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
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-sm font-medium text-muted-foreground">
            완료
          </span>
          <ChevronRightIcon size={18} className="text-muted-foreground/40" />
        </div>
      </button>
    );
  }

  // 다음에 배울 표현 — 시작 지점으로 강조한다. 해금 직후엔 한 번 펄스한다.
  return (
    <motion.button
      ref={ref}
      onClick={() => onSelect(expressionId)}
      className="flex w-full items-center gap-3 rounded-2xl border-2 border-primary bg-primary/5 px-3 py-4 text-left"
      animate={highlight ? { scale: [1, 1.04, 1] } : undefined}
      transition={{ duration: 0.5, delay: 0.25, ease: 'easeInOut' }}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {displayOrder}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold text-foreground">
          {baseExpressionMeaningText}
        </p>
      </div>
      {!hideStartAction && (
        <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
          시작할게요
        </span>
      )}
    </motion.button>
  );
};
