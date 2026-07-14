'use client';

// 대화 페이지 — 시나리오를 찾아 대화 플로우([시뮬])를 시작한다
import { use } from 'react';
import { useRouter } from 'next/navigation';

import { ConversationFlow } from '@/features/conversation/ui/ConversationFlow';
import { useScenarios } from '@/features/scenario/model/useScenarios';
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
    return (
      <main className="mx-auto flex h-dvh max-w-[430px] items-center justify-center bg-background">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </main>
    );
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
          onClick={error ? retry : () => router.push('/home')}
        >
          {error ? '다시 시도' : '홈으로'}
        </Button>
      </main>
    );
  }

  return <ConversationFlow scenario={scenario} />;
}
