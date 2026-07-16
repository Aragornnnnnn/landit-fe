'use client';

// 대화 페이지 — 시나리오를 찾아 대화 플로우([시뮬])를 시작한다
import { use } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { ConversationFlow } from '@/features/conversation/ui/ConversationFlow';
import { ConversationSkeleton } from '@/features/conversation/ui/ConversationSkeleton';
import { useScenarios } from '@/features/scenario/model/useScenarios';
import { track } from '@/shared/analytics';
import { Button } from '@/shared/ui/Button';

export default function ConversationPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = use(params);
  const id = Number(scenarioId);
  const router = useRouter();
  const { categories, error, isLoading, retry } = useScenarios();

  const scenario = categories
    ?.flatMap((category) => category.scenarios)
    .find((item) => item.scenarioId === id);

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
              : // replace로 에러 화면을 히스토리에서 지우고, 온 카드로 복귀시킨다
                () =>
                  router.replace(
                    Number.isFinite(id) ? `/home?card=${id}` : '/home',
                  )
          }
        >
          {error ? '다시 시도' : '홈으로'}
        </Button>
      </main>
    );
  }

  // key: 시나리오가 바뀌면 세션·상태를 새로 시작하도록 인스턴스를 다시 마운트한다
  return <ConversationFlow key={scenario.scenarioId} scenario={scenario} />;
}
