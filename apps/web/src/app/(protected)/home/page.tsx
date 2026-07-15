'use client';

// 홈 — 카테고리별 시나리오 목록에서 연습할 시나리오를 고른다
import { use } from 'react';
import { useRouter } from 'next/navigation';

import { useScenarios } from '@/features/scenario/model/useScenarios';
import { CategoryBar } from '@/features/scenario/ui/CategoryBar';
import { ScenarioCardSkeleton } from '@/features/scenario/ui/ScenarioCardSkeleton';
import { ScenarioList } from '@/features/scenario/ui/ScenarioList';
import { Button } from '@/shared/ui/Button';

import { HomeHeader } from './_components/HomeHeader';

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ just?: string; flip?: string; card?: string }>;
}) {
  const { just, flip, card } = use(searchParams);
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
            onClick={retry}
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
            onSelect={selectCategory}
          />
          {/* key로 카테고리 전환 시 스크롤 위치·등장 모션을 초기화한다. */}
          <ScenarioList
            key={selected.categoryId}
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
