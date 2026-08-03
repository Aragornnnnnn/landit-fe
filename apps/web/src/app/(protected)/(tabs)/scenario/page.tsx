'use client';

// 시나리오 탭 — 그날 배정된 카드 한 장을 받는다
import { Suspense } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter, useSearchParams } from 'next/navigation';

import { useDailyScenarioQuery } from '@/features/scenario/model/useDailyScenarioQuery';
import { ScenarioCardSkeleton } from '@/features/scenario/ui/ScenarioCardSkeleton';
import { TodayCard } from '@/features/scenario/ui/TodayCard';
import { track } from '@/shared/analytics';
import { Button } from '@/shared/ui/Button';

// useSearchParams는 프리렌더 시 Suspense 경계가 필요하다
export default function ScenarioPage() {
  return (
    <Suspense>
      <ScenarioContent />
    </Suspense>
  );
}

function ScenarioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 표현 마무리 후 복귀 — 그 카드를 뒷면(표현 리스트)으로 펴 둔다
  const autoFlip = searchParams.get('flip') !== null;

  const { daily, error, isLoading, retry } = useDailyScenarioQuery();

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted-foreground">{error.message}</p>
        <Button
          variant="secondary"
          size="sm"
          className="w-auto px-6"
          onClick={() => {
            track(EVENTS.ERROR_RETRIED, { screen: 'scenario' });
            retry();
          }}
        >
          다시 시도
        </Button>
      </div>
    );
  }

  if (isLoading || !daily) return <ScenarioCardSkeleton />;

  // 오늘 배정이 아직 없다 — 누를 것이 없는 화면이다
  if (!daily.scenario) return <EmptyToday />;

  return (
    <TodayCard
      daily={daily.scenario}
      playable={daily.playable}
      autoFlip={autoFlip}
      onStart={(scenario) =>
        router.push(`/conversation/${scenario.scenarioId}`)
      }
    />
  );
}

const EmptyToday = () => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
    <p className="text-2xl leading-snug font-extrabold text-foreground">
      오늘 카드는 준비 중이에요
    </p>
    <p className="text-base font-medium text-muted-foreground">
      조금 뒤에 다시 들러주세요
      <br />곧 새 카드를 가져올게요
    </p>
  </div>
);
