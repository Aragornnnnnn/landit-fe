'use client';

// 시나리오 카드 뒷면 — 완료 시나리오의 표현 학습 리스트. 표현을 고르면 학습 페이지로 이동
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { useExpressions } from '@/features/expression/model/useExpressions';
import { ExpressionList } from '@/features/expression/ui/ExpressionList';
import { ExpressionListSkeleton } from '@/features/expression/ui/ExpressionListSkeleton';
import { track } from '@/shared/analytics';
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
          원어민은 이렇게 말해요
        </h2>
        <button
          onClick={onBack}
          className="absolute right-2 flex size-10 items-center justify-center text-muted-foreground"
          aria-label="카드 앞면으로"
        >
          <CloseIcon size={22} />
        </button>
      </header>

      {/* overscroll-contain을 두면 리스트가 짧아도 스와이프를 먹어 카드 전환(바깥 스냅 스크롤)이 막힌다 —
          리스트 경계에 닿으면 제스처가 바깥으로 이어져 뒷면에서도 카드를 넘길 수 있게 한다 */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        {isLoading && <ExpressionListSkeleton />}

        {error && (
          <div className="flex flex-col items-center gap-4 px-6 pt-16 text-center">
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button
              variant="secondary"
              size="sm"
              className="w-auto px-6"
              onClick={() => {
                track(EVENTS.ERROR_RETRIED, { screen: 'card_back' });
                retry();
              }}
            >
              다시 시도
            </Button>
          </div>
        )}

        {expressions && (
          <ExpressionList
            expressions={expressions}
            onSelect={(expressionId) => {
              track(EVENTS.EXPRESSION_SELECTED, {
                expression_id: expressionId,
                scenario_id: scenarioId,
                source: 'card_back',
              });
              router.push(`/expressions/${scenarioId}/${expressionId}`);
            }}
          />
        )}
      </div>
    </>
  );
};
