'use client';

// 표현 리스트(433) — 진행도 바 + 표현 항목들
import type { Expression } from '../api/list';
import { ExpressionListItem } from './ExpressionListItem';

interface ExpressionListProps {
  expressions: Expression[];
  onSelect: (expressionId: number) => void;
  // 방금 해금됐을 때 다음 배울 표현으로 스크롤·강조한다
  focusActive?: boolean;
}

export const ExpressionList = ({
  expressions,
  onSelect,
  focusActive = false,
}: ExpressionListProps) => {
  const total = expressions.length;
  const done = expressions.filter((expression) => expression.completed).length;
  const ratio = total === 0 ? 0 : (done / total) * 100;

  // 다음에 배울(방금 해금된) 표현 — 강조·스크롤 대상
  const activeId = expressions.find(
    (expression) => !expression.completed && !expression.locked,
  )?.expressionId;

  return (
    <div className="px-5 pt-2">
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

      <ul className="flex flex-col gap-2">
        {expressions.map((expression) => (
          <li key={expression.expressionId}>
            <ExpressionListItem
              expression={expression}
              onSelect={onSelect}
              highlight={focusActive && expression.expressionId === activeId}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};
