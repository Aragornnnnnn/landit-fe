'use client';

// 전역 에러 바운더리 — 렌더 중 예외가 나면 흰 화면 대신 복구 화면을 보여주고 Sentry로 보낸다
import { useEffect } from 'react';

import { reportError } from '@/shared/monitoring/report';
import { Button } from '@/shared/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error);
  }, [error]);

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- 에러 화면은 최적화 파이프라인 의존을 피한다 */}
        <img
          src="/images/character/landy-crying.webp"
          alt=""
          className="size-[132px] object-contain"
        />
        <div>
          <h1 className="text-xl font-extrabold text-foreground">
            문제가 생겼어요
          </h1>
          <p className="mt-2 text-[15px] leading-[22px] text-muted-foreground">
            잠시 후 다시 시도해 주세요
          </p>
        </div>
      </div>
      <div className="flex-none px-5 pt-3 pb-[max(env(safe-area-inset-bottom),24px)]">
        <Button onClick={reset}>다시 시도할게요</Button>
      </div>
    </main>
  );
}
