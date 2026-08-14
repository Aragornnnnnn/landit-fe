'use client';

// 시나리오 카드 뒷면 — 완료 시나리오의 표현 학습 리스트. 표현을 고르면 학습 페이지로 이동
import { useEffect, useRef } from 'react';
import { EVENTS } from '@landit/analytics';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';

import { useExpressionsQuery } from '@/features/expression/model/useExpressionsQuery'; // 완료 카드 뒷면이 표현 목록을 조합한다 — 교차 조립 블록(widgets 후보)
import { ExpressionList } from '@/features/expression/ui/ExpressionList';
import { ExpressionListSkeleton } from '@/features/expression/ui/ExpressionListSkeleton';
import { track } from '@/shared/analytics';
import { expressionPath } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { CloseIcon } from '@/shared/ui/Icons';

import { expressionStageOf } from '../../lib/expression-progress';

// 원어민 표현을 전부 깨고 카드로 복귀한 순간의 축하 — ReviewSuccess와 같은 브랜드 색·패턴
const celebrateAllExpressionsDone = () => {
  const colors = ['#e07a3a', '#2f7d54', '#fbbf24', '#ffffff'];
  const base = {
    spread: 70,
    startVelocity: 45,
    ticks: 150,
    colors,
    disableForReducedMotion: true,
  };
  confetti({ ...base, particleCount: 55, angle: 60, origin: { x: 0, y: 0.9 } });
  confetti({
    ...base,
    particleCount: 55,
    angle: 120,
    origin: { x: 1, y: 0.9 },
  });
  confetti({
    ...base,
    particleCount: 45,
    spread: 110,
    origin: { x: 0.5, y: 0.6 },
  });
};

interface ScenarioCardBackProps {
  scenarioId: number;
  // 어느 날 카드의 뒷면인지. 표현 학습으로 들어갈 때 이어 나른다
  date?: string;
  // 앞면으로 되돌린다(뒤집기 복귀)
  onBack: () => void;
  // 표현 마무리 후 자동으로 펼쳐진 경우만 축하한다 — 목록이 뜨기 전(스켈레톤)엔 터뜨리지 않는다
  autoFlip?: boolean;
}

export const ScenarioCardBack = ({
  scenarioId,
  date,
  onBack,
  autoFlip = false,
}: ScenarioCardBackProps) => {
  const router = useRouter();
  const { expressions, error, isLoading, retry } =
    useExpressionsQuery(scenarioId);

  // 목록이 실제로 도착해 화면에 그려지는 순간에만 터뜨린다 — 재렌더로 두 번 터지지 않게 한 번만
  const celebrated = useRef(false);
  useEffect(() => {
    if (celebrated.current || !autoFlip || !expressions) return;
    const total = expressions.length;
    const done = expressions.filter(
      (expression) => expression.completed,
    ).length;
    if (expressionStageOf(done, total) !== 'done') return;
    celebrated.current = true;
    celebrateAllExpressionsDone();
  }, [autoFlip, expressions]);

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
              router.push(expressionPath(scenarioId, expressionId, date));
            }}
          />
        )}
      </div>
    </>
  );
};
