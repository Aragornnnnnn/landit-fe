'use client';

// 홈 — 카테고리별 시나리오 목록에서 연습할 시나리오를 고른다
import { use, useEffect } from 'react';
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
  searchParams: Promise<{ just?: string; flip?: string }>;
}) {
  const { just, flip } = use(searchParams);
  const flipScenarioId = flip ? Number(flip) : null;
  const router = useRouter();
  const { categories, selected, selectCategory, error, isLoading, retry } =
    useScenarios();

  // flip 대상 시나리오가 다른 카테고리에 있으면 그 카테고리를 자동으로 선택해 카드가 보이게 한다
  useEffect(() => {
    if (flipScenarioId == null || !categories) return;
    const target = categories.find((category) =>
      category.scenarios.some((s) => s.scenarioId === flipScenarioId),
    );
    if (target && target.categoryId !== selected?.categoryId) {
      selectCategory(target);
    }
  }, [flipScenarioId, categories, selected?.categoryId, selectCategory]);

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
            onStart={(scenario) =>
              router.push(`/conversation/${scenario.scenarioId}`)
            }
          />
        </>
      )}
    </main>
  );
}
