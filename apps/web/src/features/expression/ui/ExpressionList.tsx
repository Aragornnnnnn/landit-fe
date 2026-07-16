'use client';

// 표현 리스트(433) — 진행도 바 + 표현 항목들
import { motion } from 'motion/react';

import type { Expression } from '../api/list';
import { ExpressionListItem } from './ExpressionListItem';

interface ExpressionListProps {
  expressions: Expression[];
  onSelect: (expressionId: number) => void;
  // 항목을 하나씩 타타탁 순차 등장시킨다 (표현 생성 화면 리빌용)
  stagger?: boolean;
  // 활성 항목의 다음 표현 표시(👈)를 숨긴다 (하단에 학습 CTA가 따로 있을 때)
  hideStartAction?: boolean;
  // 상단 진행바(N/M 완료)를 숨긴다 (막 생성돼 전부 미완료일 때는 불필요)
  hideProgress?: boolean;
}

export const ExpressionList = ({
  expressions,
  onSelect,
  stagger = false,
  hideStartAction = false,
  hideProgress = false,
}: ExpressionListProps) => {
  const total = expressions.length;
  const done = expressions.filter((expression) => expression.completed).length;
  const ratio = total === 0 ? 0 : (done / total) * 100;

  return (
    <div className="px-5 pt-2">
      {!hideProgress && (
        <div className="mb-5">
          <p className="mb-2 text-sm font-bold text-primary">
            {done}/{total} 완료
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${ratio}%` }}
            />
          </div>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {expressions.map((expression, index) => {
          const item = (
            <ExpressionListItem
              expression={expression}
              onSelect={onSelect}
              hideStartAction={hideStartAction}
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
