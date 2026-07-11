'use client';

// 홈 — 카테고리별 시나리오 목록에서 연습할 시나리오를 고른다
import { Button } from '@/components/ui/Button';
import { useScenarios } from '@/features/scenario/model/useScenarios';
import { CategoryBar } from '@/features/scenario/ui/CategoryBar';
import { ScenarioCardSkeleton } from '@/features/scenario/ui/ScenarioCardSkeleton';
import { ScenarioList } from '@/features/scenario/ui/ScenarioList';

import { HomeHeader } from './_components/HomeHeader';

export default function HomePage() {
  const { categories, selected, selectCategory, error, isLoading, retry } =
    useScenarios();

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
          {/* key로 카테고리 전환 시 스크롤 위치·등장 모션을 초기화한다.
              onStart는 대화 이슈에서 /conversation/[scenarioId] 라우팅으로 연결한다 */}
          <ScenarioList
            key={selected.categoryId}
            scenarios={selected.scenarios}
            onStart={() => {}}
          />
        </>
      )}
    </main>
  );
}
