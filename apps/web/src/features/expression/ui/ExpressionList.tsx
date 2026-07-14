'use client';

// 표현 리스트(433) — 진행도 바 + 표현 항목들
import type { Expression } from '../api/list';
import { ExpressionListItem } from './ExpressionListItem';

interface ExpressionListProps {
  expressions: Expression[];
  onSelect: (expressionId: number) => void;
}

export const ExpressionList = ({
  expressions,
  onSelect,
}: ExpressionListProps) => {
  const total = expressions.length;
  const done = expressions.filter((expression) => expression.completed).length;
  const ratio = total === 0 ? 0 : (done / total) * 100;

  return (
    <div className="px-5 pt-2">
      <div className="mb-5">
        <div className="flex items-baseline justify-between">
          <p className="text-lg font-extrabold text-foreground">배울 표현</p>
          <p className="text-sm font-bold text-primary">
            {done}/{total} 완료
          </p>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${ratio}%` }}
          />
        </div>
      </div>

      <ul className="flex flex-col gap-1">
        {expressions.map((expression) => (
          <li key={expression.expressionId}>
            <ExpressionListItem expression={expression} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </div>
  );
};
