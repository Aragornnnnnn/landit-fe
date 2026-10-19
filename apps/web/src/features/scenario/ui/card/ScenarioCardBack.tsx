'use client';

// 시나리오 카드 뒷면 — 완료 시나리오의 표현 학습 리스트. 표현을 고르면 학습 페이지로 이동.
// 서버가 무료로 열어 준 표현(freeTrial)은 페이월 없이 연다. 첫 표현 투어 중에는 그 표현을 비추고 무료·PREMIUM을 붙인다
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';

import { useExpressionsQuery } from '@/features/expression/model/useExpressionsQuery'; // 완료 카드 뒷면이 표현 목록을 조합한다 — 교차 조립 블록(widgets 후보)
import { ExpressionList } from '@/features/expression/ui/ExpressionList';
import { ExpressionListSkeleton } from '@/features/expression/ui/ExpressionListSkeleton';
// 가로 import 사유: 학습 진입 문마다 같은 페이월 게이트를 걸어야 한다 (docs/subscription.md)
import { usePaywallGate } from '@/features/subscription/model/paywall-gate/usePaywallGate';
import { track } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';
import {
  scenarioExpressionPath,
  scenarioReturnPath,
} from '@/shared/lib/routes';
import { CloseIcon } from '@/shared/ui/Icons';
import { RetryNotice } from '@/shared/ui/RetryNotice';

import { expressionStageOf } from '../../lib/expression-progress';
import { CardSpotlight } from './CardSpotlight';

// 뒤집기(0.5초)가 끝나고 목록이 자리 잡은 뒤에 첫 표현의 자리를 잰다
const SPOTLIGHT_SETTLE_MS = 900;
// 목록 소개를 읽을 시간 — 지나면 저절로 첫 표현으로 좁힌다
const SPOTLIGHT_INTRO_MS = 2500;

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
  // 첫 표현 투어의 무료 표현 차례인가
  freeTour?: boolean;
  // 투어 중인데 서버가 이 카드에 무료 표현을 열어 주지 않았다 — 투어를 여기서 끝낸다
  onNoFreeExpression?: () => void;
}

export const ScenarioCardBack = ({
  scenarioId,
  date,
  onBack,
  autoFlip = false,
  freeTour = false,
  onNoFreeExpression,
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
    celebrateAllExpressionsDone();
  }, [autoFlip, expressions]);

  // 서버가 무료로 열어 준 표현 — 사용자당 하나라 대부분의 카드엔 없다
  const trialExpressionId = expressions?.find(
    (expression) => expression.freeTrial,
  )?.expressionId;
  // 투어가 비출 표현
  const freeExpressionId = freeTour ? trialExpressionId : undefined;
  // 무료 사용자에게는 목록에 무료·PREMIUM을 붙인다 — 뒤집기는 열려 있고 막는 건 표현이다
  const premiumLocked = freeTour || gate.locked;
  const missingFree =
    freeTour && expressions !== null && trialExpressionId === undefined;
  const endTourWithoutFree = useEffectEvent(() => onNoFreeExpression?.());
  useEffect(() => {
    if (missingFree) endTourWithoutFree();
  }, [missingFree]);
  // 무료 표현 칸 — 스포트라이트가 이 자리를 뚫는다
  const listRef = useRef<HTMLDivElement>(null);
  // 스포트라이트 두 박자 — 먼저 목록이 무엇인지 소개하고, 누르면 첫 표현으로 좁힌다
  const [spotlight, setSpotlight] = useState<'intro' | 'free'>('intro');
  const nickname = useAuthStore((state) => state.member?.nickname ?? null);
  const openExpression = (expressionId: number) =>
    router.push(scenarioExpressionPath(scenarioId, expressionId, date));

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
            premiumLocked={premiumLocked}
            freeExpressionId={trialExpressionId}
            onSelect={(expressionId) => {
              track(EVENTS.EXPRESSION_SELECTED, {
                expression_id: expressionId,
                scenario_id: scenarioId,
                source: 'card_back',
              });
              const open = () => openExpression(expressionId);
              // 무료 표현은 투어가 끝난 뒤에도 페이월 없이 연다 — 서버가 계속 열어 둔다
              if (expressionId === trialExpressionId) {
                open();
                return;
              }
              gate.guard(open, {
                source: 'expression',
                returnTo: scenarioReturnPath({ flip: scenarioId, date }),
              });
            }}
          />
        )}
      </div>

      {freeExpressionId !== undefined && spotlight === 'intro' && (
        <CardSpotlight
          key="intro"
          findTarget={() =>
            listRef.current?.querySelector<HTMLElement>('ul') ?? null
          }
          label="맞춤 표현 학습 소개"
          settleMs={SPOTLIGHT_SETTLE_MS}
          introMs={SPOTLIGHT_INTRO_MS}
          onTap={() => setSpotlight('free')}
        >
          방금 대화로 만든
          <br />
          <span className="text-primary">
            {nickname ? `${nickname}님` : '나만의'} 맞춤 표현 학습
          </span>
          이에요
        </CardSpotlight>
      )}
      {freeExpressionId !== undefined && spotlight === 'free' && (
        <CardSpotlight
          key="free"
          findTarget={() =>
            listRef.current?.querySelector<HTMLElement>(
              '[data-free-expression]',
            ) ?? null
          }
          label="첫 표현 무료로 배우기"
          settleMs={0}
          onTap={() => {
            track(EVENTS.EXPRESSION_SELECTED, {
              expression_id: freeExpressionId,
              scenario_id: scenarioId,
              source: 'card_back',
            });
            openExpression(freeExpressionId);
          }}
        >
          첫 표현은 <span className="text-primary">무료</span>로 열어 드렸어요
          <br />
          눌러서 바로 배워 봐요
        </CardSpotlight>
      )}
    </>
  );
};
