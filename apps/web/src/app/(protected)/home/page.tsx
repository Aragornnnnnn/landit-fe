'use client';

// 홈 — 카테고리별 시나리오 목록에서 연습할 시나리오를 고른다
import { Suspense } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter, useSearchParams } from 'next/navigation';

import { useScenarios } from '@/features/scenario/model/useScenarios';
import { CategoryBar } from '@/features/scenario/ui/CategoryBar';
import { ScenarioCardSkeleton } from '@/features/scenario/ui/ScenarioCardSkeleton';
import { ScenarioList } from '@/features/scenario/ui/ScenarioList';
import { track } from '@/shared/analytics';
import { Button } from '@/shared/ui/Button';

import { HomeHeader } from './_components/HomeHeader';

// useSearchParams는 프리렌더 시 Suspense 경계가 필요하다
export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  // page prop(Promise)이 아니라 훅으로 읽는다 — 클라이언트 replace 복귀 시 prop은
  // 라우터 캐시의 이전 값을 줄 수 있어, flip/card 복귀 신호가 유실되던 문제의 원인
  const searchParams = useSearchParams();
  const just = searchParams.get('just');
  const flip = searchParams.get('flip');
  const card = searchParams.get('card');
  // flip=뒤집어 복귀(표현), card=앞면으로 복귀(대화). 둘 다 "온 카드로 돌아가는" 신호다.
  const flipScenarioId = flip ? Number(flip) : null;
  const cardScenarioId = card ? Number(card) : null;
  const returnScenarioId = flipScenarioId ?? cardScenarioId;
  const router = useRouter();
  // 복귀 대상이 있으면 그 카테고리를 기본으로 연다(사용자가 칩을 누르면 그게 우선 — 강제 X)
  const { categories, selected, selectCategory, error, isLoading, retry } =
    useScenarios(returnScenarioId);

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-muted">
      <HomeHeader />

      {error && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-muted-foreground">{error.message}</p>
          <Button
            variant="secondary"
            size="sm"
            className="w-auto px-6"
            onClick={() => {
              track(EVENTS.ERROR_RETRIED, { screen: 'home' });
              retry();
            }}
          >
            다시 시도
          </Button>
        </div>
      )}

      {!error && isLoading && <ScenarioCardSkeleton />}

      {categories && selected && (
        <>
          <CategoryBar
            categories={categories}
            selectedId={selected.categoryId}
            onSelect={(category) => {
              track(EVENTS.CATEGORY_SELECTED, {
                category_id: category.categoryId,
                category_name: category.categoryName,
                is_locked: category.categoryLocked,
              });
              selectCategory(category);
            }}
          />
          {/* key로 카테고리 전환 시 스크롤 위치·등장 모션을 초기화한다. */}
          <ScenarioList
            key={selected.categoryId}
            categoryName={selected.categoryName}
            scenarios={selected.scenarios}
            focusActive={just === '1'}
            flipScenarioId={flipScenarioId}
            cardScenarioId={cardScenarioId}
            onStart={(scenario) =>
              router.push(`/conversation/${scenario.scenarioId}`)
            }
          />
        </>
      )}
    </main>
  );
}
