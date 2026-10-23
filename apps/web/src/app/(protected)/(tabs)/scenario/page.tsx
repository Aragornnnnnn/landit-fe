'use client';

// 시나리오 탭 — 그날 배정된 카드 한 장을 받는다. 날짜는 ?date=로 넘기고 없으면 오늘
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useForceUpdateFirst } from '@/features/app-update/model/useForceUpdateFirst';
import { EventPopupGate } from '@/features/event-popup/ui/EventPopupGate';
import { NotificationConsentGate } from '@/features/notification/ui/NotificationConsentGate';
import { SatisfactionGate } from '@/features/satisfaction/ui/SatisfactionGate';
import type { Scenario } from '@/features/scenario/lib/to-scenario';
import { useDailyScenarioQuery } from '@/features/scenario/model/useDailyScenarioQuery';
import { CalendarStrip } from '@/features/scenario/ui/CalendarStrip';
import { ScenarioBriefing } from '@/features/scenario/ui/ScenarioBriefing';
import { ScenarioCardSkeleton } from '@/features/scenario/ui/ScenarioCardSkeleton';
import { TodayCard } from '@/features/scenario/ui/TodayCard';
import { usePromoSheetOpen } from '@/features/subscription/model/exit-promo/promo-handoff';
import {
  readDateParam,
  scenarioReturnPath,
  scenarioTalkPath,
} from '@/shared/lib/routes';
import { RetryNotice } from '@/shared/ui/RetryNotice';

import { useEarnShowerHold } from '../_model/useEarnShowerHold';
import { useSatisfactionSheet } from '../_model/useSatisfactionSheet';
import { eventPopupOrder } from './_model/event-popup-order';
import { useActiveEventPopup } from './_model/useActiveEventPopup';
import { useHomePreview } from './_model/useHomePreview';
import { PreviewIntro } from './_ui/PreviewIntro';

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
  // 이번 방문에 띄울 시트 하나 — 소감·리뷰가 없을 때만 알림 동의를 청한다
  const satisfactionSheet = useSatisfactionSheet('scenario');
  // 할인 시트가 떠 있으면 소감은 미룬다 — 할인은 5분뿐이고 소감은 다음에 또 물을 수 있다
  const promoOpen = usePromoSheetOpen();
  // 돌아온 순간의 환급 동전 연출이 끝날 때까지도 미룬다 — 어둠 아래에서 시트가 같이 올라오면 둘이 겹친다
  const showerHold = useEarnShowerHold();
  const { popup: eventPopup, loading: eventPopupLoading } =
    useActiveEventPopup();
  const [eventPopupClosed, setEventPopupClosed] = useState(false);
  // 강제 업데이트가 1순위다 — 그거거나 그럴지 모르는 동안엔 공지·램프·시트 모두 나서지 않는다
  const updateFirst = useForceUpdateFirst();
  const { pending: eventPopupPending, ready: eventPopupReady } =
    eventPopupOrder({
      loading: eventPopupLoading,
      hasPopup: eventPopup !== null,
      closed: eventPopupClosed,
      updateFirst,
      promoOpen,
      showerHold,
    });
  // 대화 시작을 눌렀다 — 바로 이동하지 않고 브리핑 카드를 잠깐 보여준 뒤 대화로 들어간다
  const [briefingScenario, setBriefingScenario] = useState<Scenario | null>(
    null,
  );

  // 완료한 날은 카드 앞면(같은 썸네일·제목·설명)이 이미 떠 있다 — 램프로 시작하는 날만 브리핑이 필요하다
  const cleared = daily?.scenario?.dailyScenarioType === 'CLEARED';
  // 프리미엄 프리뷰 — 오늘 카드를 끝낸 무료 사용자에게 챌린지를 소개하고 표현 하나를 무료로 열어 준다
  const premiumPreview = useHomePreview({
    cleared: cleared && date === undefined,
    held: updateFirst || showerHold || eventPopupPending,
  });
  const sheetsHeld =
    updateFirst ||
    promoOpen ||
    showerHold ||
    premiumPreview.active ||
    eventPopupPending;
  // 대화는 페이월 문이 아니다 — 오늘 카드든 지난 카드든, 재대화든 구독과 관계없이 시작한다.
  // 무료 사용자가 막히는 건 그 뒤의 상세 피드백과 표현 학습이다 (docs/subscription.md 「무료 구간과 페이월 게이트」)
  const start = (scenario: Scenario) => {
    if (cleared) {
      router.push(scenarioTalkPath(scenario.scenarioId, date));
      return;
    }
    setBriefingScenario(scenario);
    // 브리핑을 읽는 동안 대화 라우트를 미리 받아 둔다 — 이 화면은 링크로 오갈 수 없어 자동 프리페치가 안 걸린다
    router.prefetch(scenarioTalkPath(scenario.scenarioId, date));
  };
  const settled = date === undefined && (cleared || summonClosed);
  // 시트류(소감 다음 순번)가 나설 차례 — 카드 판단이 끝났고 소감 시트가 안 뜰 때.
  // 이번 방문에 공지를 띄웠으면 알림 동의는 다음 방문으로 넘긴다 — 들어오자마자 시트가 연달아 뜨지 않게
  const promptTurn =
    settled && satisfactionSheet === null && eventPopup === null;

  // 날짜 이동은 replace다 — push면 히스토리가 쌓여 뒤로가기가 날짜 되감기가 된다.
  // 오늘은 날짜 없는 주소가 정본이다 — 붙여 두면 자정을 넘겨도 어제에 머문다
  const selectDate = (next: string | null) =>
    router.replace(scenarioReturnPath({ date: next }));

  if (error) {
    return (
      <RetryNotice
        fill
        screen="scenario"
        message={error.message}
        onRetry={retry}
      />
    );
  }

  return (
    <>
      {/* 창과 선택은 URL의 date가 정한다 — 응답을 기다렸다 정하면 누른 뒤 1초 넘게 그대로라 안 눌린 줄 안다 */}
      <CalendarStrip date={date} onSelect={selectDate} />

      {!daily ? (
        <ScenarioCardSkeleton />
      ) : !daily.scenario ? (
        // 그날 받은 카드가 없다 — 놓친 날이거나 오늘 배정이 아직 없는 날
        // 날짜를 안 줬다는 건 오늘을 보고 있다는 뜻이다
        <EmptyDay isToday={date === undefined} />
      ) : (
        <TodayCard
          // 날마다 새 카드다 — 같은 자리라고 앞 날의 뒤집힘 상태를 물려받지 않게
          key={date ?? 'today'}
          daily={daily.scenario}
          playable={daily.playable}
          date={date}
          today={daily.date}
          autoFlip={autoFlip}
          premiumPreview={premiumPreview.cardPreview}
          onStart={start}
          onSummonClose={() => setSummonClosed(true)}
          summonHeld={updateFirst || eventPopupPending}
        />
      )}

      {settled && !sheetsHeld && satisfactionSheet === 'talk' && (
        <SatisfactionGate moment="scenario" />
      )}
      {settled && !sheetsHeld && satisfactionSheet === 'review' && (
        <SatisfactionGate moment="review" />
      )}
      {eventPopup && eventPopupReady && (
        <EventPopupGate
          popup={eventPopup}
          open={!eventPopupClosed}
          onClose={() => setEventPopupClosed(true)}
        />
      )}
      {promptTurn && !sheetsHeld && <NotificationConsentGate />}

      {premiumPreview.view === 'tutorial' && (
        <PreviewIntro
          dailyWon={premiumPreview.dailyWon}
          onDone={premiumPreview.finishTutorial}
        />
      )}

      {/* 브리핑을 다 보여주면 대화로 넘어간다 — push라 뒤로가기는 이 화면(카드)으로 돌아온다 */}
      {briefingScenario && (
        <ScenarioBriefing
          scenario={briefingScenario}
          onDone={() =>
            router.push(scenarioTalkPath(briefingScenario.scenarioId, date))
          }
          onCancel={() => setBriefingScenario(null)}
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
