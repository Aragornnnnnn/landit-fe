'use client';

// 표현 리스트 항목 — 완료(연녹색 체크) / 시작할 표현(강조 카드) / 잠금(회색) 상태를 그린다
import { CheckIcon, LockIcon } from '@/shared/ui/Icons';

import type { Expression } from '../api/list';

interface ExpressionListItemProps {
  expression: Expression;
  onSelect: (expressionId: number) => void;
  // 활성 항목의 다음 표현 표시(👈)를 숨긴다
  hideStartAction?: boolean;
}

export const ExpressionListItem = ({
  expression,
  onSelect,
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

  if (locked) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-secondary/40 px-3.5 py-3.5 opacity-60">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <LockIcon size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-muted-foreground">
            {baseExpressionMeaningText}
          </p>
          {/* 영어 표현은 잠금 상태에서도 미리 보여준다 */}
          <p className="truncate text-sm font-medium text-muted-foreground/70">
            {targetExpressionText}
          </p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      // 이미 깬 표현 — 눌린(가라앉은) 상태로 그려 아직 안 깬 항목의 3D 돌출과 대비시킨다
      <button
        onClick={() => onSelect(expressionId)}
        className="flex w-full items-center gap-3 rounded-2xl border border-transparent bg-secondary/60 px-3.5 py-3.5 text-left transition-colors active:bg-secondary"
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
      </button>
    );
  }

  // 다음에 배울 표현 — 시작 지점으로 강조한다. 공용 Button과 같은 3D 눌림 효과로 누를 수 있음을 드러낸다
  return (
    <button
      onClick={() => onSelect(expressionId)}
      className="flex w-full items-center gap-3 rounded-2xl border-2 border-primary bg-primary/5 px-3 py-4 text-left shadow-[0_3px_0_var(--primary)] transition-[translate,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {displayOrder}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold text-foreground">
          {baseExpressionMeaningText}
        </p>
        {/* 영어 표현을 완료 전에도 바로 보여준다 — 완료해야만 보이던 것을 학습 진입 전 미리보기로 */}
        <p className="truncate text-sm font-medium text-muted-foreground">
          {targetExpressionText}
        </p>
      </div>
      {/* 글자 라벨 대신 왼쪽을 가리키는 손가락 — '다음은 이거'를 직관적으로 (스크린리더용 텍스트는 따로) */}
      {!hideStartAction && (
        <>
          <span className="tossface shrink-0 text-2xl" aria-hidden>
            👈
          </span>
          <span className="sr-only">다음에 배울 표현</span>
        </>
      )}
    </button>
  );
};
