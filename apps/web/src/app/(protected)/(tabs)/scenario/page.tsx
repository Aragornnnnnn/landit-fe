'use client';

// 시나리오 탭 — 그날 배정된 카드 한 장을 받는다. 날짜는 ?date=로 넘기고 없으면 오늘
import { Suspense, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter, useSearchParams } from 'next/navigation';

import { NotificationConsentGate } from '@/features/notification/ui/NotificationConsentGate';
import { useDailyScenarioQuery } from '@/features/scenario/model/useDailyScenarioQuery';
import { CalendarStrip } from '@/features/scenario/ui/CalendarStrip';
import { ScenarioCardSkeleton } from '@/features/scenario/ui/ScenarioCardSkeleton';
import { TodayCard } from '@/features/scenario/ui/TodayCard';
import { track } from '@/shared/analytics';
import {
  conversationPath,
  readDateParam,
  scenarioReturnPath,
} from '@/shared/lib/routes';
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
  const date = readDateParam(searchParams);
  // 표현 마무리 후 복귀 — 그 카드를 뒷면(표현 리스트)으로 펴 둔다
  const autoFlip = searchParams.get('flip') !== null;

  const { daily, error, retry } = useDailyScenarioQuery(date);

  // 알림은 오늘 카드에 대한 판단이 끝난 뒤에만 청한다 — 대화를 끝냈거나, 지금은 안 하기로 했거나.
  // 들어오자마자 물으면 램프 연출을 덮고, 대화를 해보기도 전이라 무엇을 알려주겠다는 건지 와닿지 않는다.
  // 지난 날 카드도 완료했으면 CLEARED라 날짜가 없는(=오늘) 화면으로 한정한다
  const [summonClosed, setSummonClosed] = useState(false);
  const settled =
    date === undefined &&
    (daily?.scenario?.dailyScenarioType === 'CLEARED' || summonClosed);

  // 날짜 이동은 replace다 — push면 히스토리가 쌓여 뒤로가기가 날짜 되감기가 된다.
  // 오늘은 날짜 없는 주소가 정본이다 — 붙여 두면 자정을 넘겨도 어제에 머문다
  const selectDate = (next: string | null) =>
    router.replace(scenarioReturnPath({ date: next }));

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
      {/* 창은 주소가 정한다 — 응답을 기다렸다 정하면 오늘 창을 한 번 받고 버리게 된다.
          선택 표시만 응답이 준 날짜를 따른다 */}
      <CalendarStrip
        windowDate={date}
        selected={daily?.date ?? null}
        onSelect={selectDate}
      />

      {!daily ? (
        <ScenarioCardSkeleton />
      ) : !daily.scenario ? (
        // 그날 받은 카드가 없다 — 놓친 날이거나 오늘 배정이 아직 없는 날
        // 날짜를 안 줬다는 건 오늘을 보고 있다는 뜻이다
        <EmptyDay isToday={date === undefined} />
      ) : (
        <TodayCard
          daily={daily.scenario}
          playable={daily.playable}
          date={date}
          today={daily.date}
          autoFlip={autoFlip}
          onStart={(scenario) =>
            router.push(conversationPath(scenario.scenarioId, date))
          }
          onSummonClose={() => setSummonClosed(true)}
        />
      )}

      {settled && <NotificationConsentGate />}
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
