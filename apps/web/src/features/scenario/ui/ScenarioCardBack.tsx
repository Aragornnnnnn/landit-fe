'use client';

// 시나리오 카드 뒷면 — 완료 시나리오의 표현 학습 리스트. 표현을 고르면 학습 페이지로 이동
import { useRouter } from 'next/navigation';

import { useExpressions } from '@/features/expression/model/useExpressions';
import { ExpressionList } from '@/features/expression/ui/ExpressionList';
import { ExpressionListSkeleton } from '@/features/expression/ui/ExpressionListSkeleton';
import { Button } from '@/shared/ui/Button';
import { CloseIcon } from '@/shared/ui/Icons';

interface ScenarioCardBackProps {
  scenarioId: number;
  // 앞면으로 되돌린다(뒤집기 복귀)
  onBack: () => void;
}

export const ScenarioCardBack = ({
  scenarioId,
  onBack,
}: ScenarioCardBackProps) => {
  const router = useRouter();
  const { expressions, error, isLoading, retry } = useExpressions(scenarioId);

  return (
    <>
      <header className="relative flex h-14 flex-none items-center justify-center px-3">
        <h2 className="text-base font-bold text-foreground">
          이 대화로 만든 내 표현들
        </h2>
        <button
          onClick={onBack}
          className="absolute right-2 flex size-10 items-center justify-center text-muted-foreground"
          aria-label="카드 앞면으로"
        >
          <CloseIcon size={22} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
        {isLoading && <ExpressionListSkeleton />}

        {error && (
          <div className="flex flex-col items-center gap-4 px-6 pt-16 text-center">
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button
              variant="secondary"
              size="sm"
              className="w-auto px-6"
              onClick={retry}
            >
              다시 시도
            </Button>
          </div>
        )}

        {expressions && (
          <ExpressionList
            expressions={expressions}
            onSelect={(expressionId) =>
              router.push(`/expressions/${scenarioId}/${expressionId}`)
            }
          />
        )}
      </div>
    </>
  );
};
