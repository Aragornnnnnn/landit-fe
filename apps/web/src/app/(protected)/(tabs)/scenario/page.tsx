'use client';

// 시나리오 탭 — 그날 배정된 카드 한 장을 받는다. 날짜는 ?d=로 넘기고 없으면 오늘
import { Suspense } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter, useSearchParams } from 'next/navigation';

import { useDailyScenarioQuery } from '@/features/scenario/model/useDailyScenarioQuery';
import { CalendarStrip } from '@/features/scenario/ui/CalendarStrip';
import { ScenarioCardSkeleton } from '@/features/scenario/ui/ScenarioCardSkeleton';
import { TodayCard } from '@/features/scenario/ui/TodayCard';
import { track } from '@/shared/analytics';
import { conversationPath } from '@/shared/lib/routes';
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

  // 날짜가 없으면 서버가 오늘 것을 준다 — 기기에서 오늘을 계산하면 자정 경계가 서버와 어긋난다
  const date = searchParams.get('date') ?? undefined;
  // 표현 마무리 후 복귀 — 그 카드를 뒷면(표현 리스트)으로 펴 둔다
  const autoFlip = searchParams.get('flip') !== null;

  const { daily, error, isLoading, retry } = useDailyScenarioQuery(date);

  // 날짜 이동은 replace다 — push면 히스토리가 쌓여 뒤로가기가 날짜 되감기가 된다.
  // 오늘은 날짜 없는 주소가 정본이다 — 붙여 두면 자정을 넘겨도 어제에 머문다
  const selectDate = (next: string | null) =>
    router.replace(next ? `/scenario?date=${next}` : '/scenario');

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

  return (
    <>
      {/* 응답이 오기 전에는 고른 날이 없다 — 스트립은 서버가 준 오늘 창을 먼저 보여준다 */}
      <CalendarStrip date={daily?.date ?? null} onSelect={selectDate} />

      {isLoading || !daily ? (
        <ScenarioCardSkeleton />
      ) : !daily.scenario ? (
        // 그날 받은 카드가 없다 — 놓친 날이거나 오늘 배정이 아직 없는 날
        // 날짜를 안 줬다는 건 오늘을 보고 있다는 뜻이다
        <EmptyDay isToday={date === undefined} />
      ) : (
        <TodayCard
          daily={daily.scenario}
          playable={daily.playable}
          autoFlip={autoFlip}
          onStart={(scenario) =>
            router.push(conversationPath(scenario.scenarioId, date))
          }
        />
      )}
    </>
  );
}

const EmptyDay = ({ isToday }: { isToday: boolean }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
    <p className="text-2xl leading-snug font-extrabold text-foreground">
      {isToday ? '오늘 카드는 준비 중이에요' : '이 날은 카드가 없어요'}
    </p>
    <p className="text-base font-medium text-muted-foreground">
      {isToday ? (
        <>
          조금 뒤에 다시 들러주세요
          <br />곧 새 카드를 가져올게요
        </>
      ) : (
        <>
          그날은 대화를 남기지 않았어요
          <br />
          지나간 카드는 다시 열 수 없어요
        </>
      )}
    </p>
  </div>
);
