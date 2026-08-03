'use client';

// 완료 카드의 표현 학습 진행 줄 — 몇 개 남았는지 보여주고 다음 행동을 버튼 문구로 못박는다
import { Button } from '@/shared/ui/Button';

import {
  expressionStageOf,
  type ExpressionStage,
} from '../lib/expression-progress';

// 남은 게 있으면 주황, 다 했으면 초록 — 색이 곧 "할 일이 남았는지"다
const STAGE_STYLE: Record<
  Exclude<ExpressionStage, 'unavailable'>,
  { label: string; variant: 'primary' | 'success'; bar: string; count: string }
> = {
  none: {
    label: '표현 배우기',
    variant: 'primary',
    bar: 'bg-primary',
    count: 'text-muted-foreground',
  },
  partial: {
    label: '이어서 표현 배우기',
    variant: 'primary',
    bar: 'bg-primary',
    count: 'text-primary',
  },
  done: {
    label: '표현 복습하기',
    variant: 'success',
    bar: 'bg-success',
    count: 'text-success',
  },
};

interface ExpressionProgressProps {
  completed: number;
  total: number;
  onLearn: () => void;
}

export const ExpressionProgress = ({
  completed,
  total,
  onLearn,
}: ExpressionProgressProps) => {
  const stage = expressionStageOf(completed, total);
  // 배정된 표현이 없으면 진행도도 버튼도 없다 — 남은 건 다시 대화하기뿐이다
  if (stage === 'unavailable') return null;

  const style = STAGE_STYLE[stage];
  const done = Math.min(completed, total);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-bold text-muted-foreground">
          원어민 표현
        </span>
        <span className={`text-sm font-bold ${style.count}`}>
          {done}/{total} 완료
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="원어민 표현 학습 진행도"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
      >
        {/* 하나도 안 했으면 채운 자리가 없다 — 트랙만 남는다 */}
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${style.bar}`}
          style={{ width: `${(done / total) * 100}%` }}
        />
      </div>

      <Button variant={style.variant} onClick={onLearn}>
        {style.label}
      </Button>
    </div>
  );
};
