'use client';

// 시나리오 카드 뒷면 — 완료 시나리오의 표현 학습 리스트. 표현을 고르면 학습 페이지로 이동.
// 서버가 무료로 열어 준 표현(freeTrial)은 페이월 없이 연다. 무료 사용자 목록에는 무료·PREMIUM을 붙이고, 프리미엄 프리뷰 중에는 그 표현을 비춘다
import { useEffect, useEffectEvent, useRef } from 'react';
import { EVENTS, type PreviewEndReason } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { useExpressionsQuery } from '@/features/expression/model/useExpressionsQuery'; // 완료 카드 뒷면이 표현 목록을 조합한다 — 교차 조립 블록(widgets 후보)
import { ExpressionList } from '@/features/expression/ui/ExpressionList';
import { ExpressionListSkeleton } from '@/features/expression/ui/ExpressionListSkeleton';
// 가로 import 사유: 학습 진입 문마다 같은 페이월 게이트를 걸어야 한다 (docs/subscription.md)
import { usePaywallGate } from '@/features/subscription/model/paywall-gate/usePaywallGate';
import { track } from '@/shared/analytics';
import {
  scenarioExpressionPath,
  scenarioReturnPath,
} from '@/shared/lib/routes';
import { burstConfetti } from '@/shared/motion/confetti';
import { CloseIcon } from '@/shared/ui/Icons';
import { RetryNotice } from '@/shared/ui/RetryNotice';

import { expressionStageOf } from '../../lib/expression-progress';
import { FreeExpressionSpotlight } from './FreeExpressionSpotlight';

interface ScenarioCardBackProps {
  scenarioId: number;
  // 어느 날 카드의 뒷면인지. 표현 학습으로 들어갈 때 이어 나른다
  date?: string;
  // 앞면으로 되돌린다(뒤집기 복귀)
  onBack: () => void;
  // 표현 마무리 후 자동으로 펼쳐진 경우만 축하한다 — 목록이 뜨기 전(스켈레톤)엔 터뜨리지 않는다
  autoFlip?: boolean;
  // 주면 프리미엄 프리뷰 중이다 — 프리뷰를 여기서 끝낼 때 부른다(줄 무료 표현이 없거나, 비출 자리를 못 찾았거나, 사용자가 넘겼다)
  onPreviewEnd?: (reason: PreviewEndReason) => void;
  // 프리뷰가 비춘 무료 표현을 열었을 때 부른다 — 끝까지 안 하고 나와도 다시 비추지 않게
  onPreviewOpen?: () => void;
}

export const ScenarioCardBack = ({
  scenarioId,
  date,
  onBack,
  autoFlip = false,
  onPreviewEnd,
  onPreviewOpen,
}: ScenarioCardBackProps) => {
  const router = useRouter();
  const gate = usePaywallGate();
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
    burstConfetti();
  }, [autoFlip, expressions]);

  // 서버가 무료로 열어 준 표현 — 사용자당 하나라 대부분의 카드엔 없다
  const freeTrialExpression = expressions?.find(
    (expression) => expression.freeTrial,
  );
  const freeTrialExpressionId = freeTrialExpression?.expressionId;
  // 프리뷰가 비출 표현 — 프리뷰 중이고, 무료 표현이 있고, 아직 안 끝냈을 때
  const previewTarget =
    onPreviewEnd && freeTrialExpression && !freeTrialExpression.completed
      ? freeTrialExpression
      : undefined;
  // 프리뷰 중인데 비출 표현이 없다 — 이 카드엔 무료 표현이 없거나 이미 끝냈다(프리뷰 밖에서 마친 경우)
  const missingPreviewTarget =
    onPreviewEnd !== undefined &&
    expressions !== null &&
    previewTarget === undefined;
  const endPreviewWithoutTarget = useEffectEvent(() =>
    onPreviewEnd?.('no_free_expression'),
  );
  useEffect(() => {
    if (missingPreviewTarget) endPreviewWithoutTarget();
  }, [missingPreviewTarget]);
  const listRef = useRef<HTMLDivElement>(null);

  const selectExpression = (expressionId: number) => {
    track(EVENTS.EXPRESSION_SELECTED, {
      expression_id: expressionId,
      scenario_id: scenarioId,
      source: 'card_back',
    });
    const open = () =>
      router.push(scenarioExpressionPath(scenarioId, expressionId, date));
    // 무료 표현은 프리뷰가 끝난 뒤에도 페이월 없이 연다 — 서버가 계속 열어 둔다
    if (expressionId === freeTrialExpressionId) {
      open();
      return;
    }
    gate.guard(open, {
      source: 'expression',
      returnTo: scenarioReturnPath({ flip: scenarioId, date }),
    });
  };

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
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto pb-6">
        {isLoading && <ExpressionListSkeleton />}

        {error && (
          <RetryNotice
            screen="card_back"
            message={error.message}
            onRetry={retry}
          />
        )}

        {expressions && (
          <ExpressionList
            expressions={expressions}
            premiumLocked={gate.locked}
            freeTrialExpressionId={freeTrialExpressionId}
            onSelect={selectExpression}
          />
        )}
      </div>

      {previewTarget && onPreviewEnd && (
        <FreeExpressionSpotlight
          list={listRef}
          onOpen={() => {
            onPreviewOpen?.();
            selectExpression(previewTarget.expressionId);
          }}
          onEnd={onPreviewEnd}
        />
      )}
    </>
  );
};
