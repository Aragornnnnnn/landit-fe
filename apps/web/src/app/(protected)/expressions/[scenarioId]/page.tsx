'use client';

// 표현 리스트 페이지(433) — 시나리오별 원어민 표현 목록에서 배울 표현을 고른다
import { use } from 'react';
import { useRouter } from 'next/navigation';

import { useExpressions } from '@/features/expression/model/useExpressions';
import { ExpressionList } from '@/features/expression/ui/ExpressionList';
import { Button } from '@/shared/ui/Button';
import { ChevronLeftIcon } from '@/shared/ui/Icons';

export default function ExpressionListPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = use(params);
  const id = Number(scenarioId);
  const router = useRouter();
  const { expressions, error, isLoading, retry } = useExpressions(id);

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <header className="relative flex h-14 flex-none items-center justify-center px-3">
        <button
          onClick={() => router.push('/home')}
          className="absolute left-2 flex size-10 items-center justify-center text-foreground"
          aria-label="뒤로"
        >
          <ChevronLeftIcon size={24} />
        </button>
        <h1 className="text-base font-bold text-foreground">
          표현으로 배워봐요
        </h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-8">
        {isLoading && (
          <p className="px-5 pt-6 text-sm text-muted-foreground">
            불러오는 중…
          </p>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 px-6 pt-16 text-center">
            <p className="text-sm text-muted-foreground">{error.message}</p>
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

        {expressions && (
          <ExpressionList
            expressions={expressions}
            onSelect={(expressionId) =>
              router.push(`/expressions/${id}/${expressionId}`)
            }
          />
        )}
      </div>
    </main>
  );
}
