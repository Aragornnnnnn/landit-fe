'use client';

// 대화 페이지 — 시나리오를 찾아 대화 플로우([시뮬])를 시작한다
import { Suspense, use } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter, useSearchParams } from 'next/navigation';

import { ConversationSkeleton } from '@/features/conversation/ui/ConversationSkeleton';
import { toScenario } from '@/features/scenario/lib/to-scenario';
import { useDailyScenarioQuery } from '@/features/scenario/model/useDailyScenarioQuery';
import { track } from '@/shared/analytics';
import { readDateParam, scenarioReturnPath } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';

import { ScenarioTalkFlow } from './_ui/ScenarioTalkFlow';

// useSearchParams는 프리렌더 시 Suspense 경계가 필요하다
export default function ScenarioTalkPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  return (
    <Suspense fallback={<ConversationSkeleton />}>
      <ScenarioTalkContent params={params} />
    </Suspense>
  );
}

function ScenarioTalkContent({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = use(params);
  // 지난 날 카드에서 들어오면 그 날짜가 실려 온다. 없으면 오늘이다.
  // searchParams prop은 앱 안에서 이동할 때 갱신되지 않아 훅으로 읽는다
  const date = readDateParam(useSearchParams());
  const id = Number(scenarioId);
  const router = useRouter();
  const { daily, error, isLoading, retry } = useDailyScenarioQuery(date);

  // 그 날 카드가 이 시나리오일 때만 연다 — 주소만 갈아끼운 진입을 막는다
  const source = daily?.scenario;
  const scenario =
    source && source.scenarioId === id
      ? toScenario(source, daily.playable)
      : undefined;

  if (isLoading) {
    return <ConversationSkeleton />;
  }

  if (error || !scenario) {
    return (
      <main className="mx-auto flex h-dvh max-w-[430px] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-sm text-muted-foreground">
          {error?.message ?? '시나리오를 찾을 수 없어요.'}
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="w-auto px-6"
          onClick={
            error
              ? () => {
                  track(EVENTS.ERROR_RETRIED, { screen: 'conversation' });
                  retry();
                }
              : // replace로 에러 화면을 히스토리에서 지우고 시나리오 탭으로 돌려보낸다
                () => router.replace(scenarioReturnPath({ date }))
          }
        >
          {error ? '다시 시도' : '홈으로'}
        </Button>
      </main>
    );
  }

  // key: 시나리오가 바뀌면 세션·상태를 새로 시작하도록 인스턴스를 다시 마운트한다
  return (
    <ScenarioTalkFlow
      key={scenario.scenarioId}
      scenario={scenario}
      date={date}
    />
  );
}
