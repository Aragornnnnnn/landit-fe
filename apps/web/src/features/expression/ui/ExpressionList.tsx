'use client';

// 표현 리스트(433) — 진행도 바 + 표현 항목들
import { motion } from 'motion/react';

import type { Expression } from '../api/list';
import { ExpressionListItem } from './list/ExpressionListItem';

interface ExpressionListProps {
  expressions: Expression[];
  onSelect: (expressionId: number) => void;
  // 항목을 하나씩 타타탁 순차 등장시킨다 (표현 생성 화면 리빌용)
  stagger?: boolean;
  // 활성 항목의 다음 표현 표시(👈)를 숨긴다 (하단에 학습 CTA가 따로 있을 때)
  hideStartAction?: boolean;
  // 상단 진행바(N/M 완료)를 숨긴다 (막 생성돼 전부 미완료일 때는 불필요)
  hideProgress?: boolean;
  // 진행 표시 왼쪽에 서는 제목 — 화면에 다른 블록이 함께 있어 무슨 목록인지 밝혀야 할 때만 준다
  title?: string;
  // 무료 사용자의 목록인가 — 서버가 무료로 열어 준 표현(freeTrialExpressionId)엔 「무료」, 나머지 안 끝낸 표현엔 「PREMIUM」을 붙인다
  premiumLocked?: boolean;
  freeTrialExpressionId?: number;
}

export const ExpressionList = ({
  expressions,
  onSelect,
  stagger = false,
  hideStartAction = false,
  hideProgress = false,
  title,
  premiumLocked = false,
  freeTrialExpressionId,
}: ExpressionListProps) => {
  // 무료 사용자에게만 붙는 표시 — 유료 사용자와 이미 끝낸 표현에는 없다
  const accessBadgeOf = (expression: Expression) => {
    if (!premiumLocked) return undefined;
    if (expression.expressionId === freeTrialExpressionId) return 'free';
    if (expression.completed) return undefined;
    return 'premium';
  };
  const total = expressions.length;
  const done = expressions.filter((expression) => expression.completed).length;
  const ratio = total === 0 ? 0 : (done / total) * 100;
  // 카드 앞면(ExpressionProgress)과 같은 규칙 — 다 하면 초록, 아니면 주황
  const complete = total > 0 && done >= total;

  return (
    <div className="px-5 pt-2">
      {!hideProgress && (
        <div className="mb-5">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            {title && (
              <p className="text-sm font-bold text-foreground">{title}</p>
            )}
            <p
              className={`text-sm font-bold ${complete ? 'text-success' : 'text-primary'}`}
            >
              {done}/{total} 완료
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${complete ? 'bg-success' : 'bg-primary'}`}
              style={{ width: `${ratio}%` }}
            />
          </div>
        </div>
      )}

      {/* 표식 — 첫 표현 투어가 목록 전체를 비출 때 찾는다 */}
      <ul data-expression-items className="flex flex-col gap-2">
        {expressions.map((expression, index) => {
          const item = (
            <ExpressionListItem
              expression={expression}
              onSelect={onSelect}
              hideStartAction={hideStartAction}
              accessBadge={accessBadgeOf(expression)}
            />
          );
          return stagger ? (
            <motion.li
              key={expression.expressionId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.06,
                duration: 0.28,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {item}
            </motion.li>
          ) : (
            <li key={expression.expressionId}>{item}</li>
          );
        })}
      </ul>
    </div>
  );
};
