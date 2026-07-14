// 대화 화면 스켈레톤 — 시나리오 로딩 동안 레이아웃 자리를 잡아 빈 스피너 대신 보여준다
'use client';

export const ConversationSkeleton = () => (
  <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
    {/* 무대 자리 */}
    <div
      className="w-full flex-none animate-pulse rounded-b-3xl border-b border-border bg-muted/40"
      style={{
        height: 'calc(min(17rem, 34dvh) + max(env(safe-area-inset-top), 8px))',
      }}
    />

    <section className="flex min-h-0 flex-1 flex-col px-5 pt-5">
      {/* 질문 카드 자리 */}
      <div className="w-full rounded-[28px] rounded-tl-md bg-card px-6 py-6 shadow-lg shadow-black/5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-5 w-1/2 animate-pulse rounded bg-muted" />
      </div>
      {/* 내 답변 자리 */}
      <div className="mt-4 min-h-28 w-full animate-pulse rounded-2xl border border-border/60 bg-muted/40" />
    </section>

    {/* 마이크 자리 */}
    <footer className="flex-none pb-[max(env(safe-area-inset-bottom),16px)]">
      <div className="flex h-36 flex-col items-center justify-center">
        <div className="size-20 animate-pulse rounded-full bg-muted" />
      </div>
    </footer>
  </main>
);
