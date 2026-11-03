// 대화 화면 스켈레톤 — 대화 데이터 로딩 동안 레이아웃 자리를 잡아 빈 스피너 대신 보여준다
'use client';

// 연한 바탕 위에서도 자리가 또렷하게 보이고, 빛이 흘러 불러오는 중임을 알린다
const BLOCK_CLASS = 'animate-skeleton-flow bg-border!';

export const ConversationSkeleton = () => (
  <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
    {/* 무대 자리 */}
    <div
      className={`w-full flex-none rounded-b-3xl ${BLOCK_CLASS}`}
      style={{
        height:
          'calc(min(17rem, 34dvh) + max(var(--safe-area-inset-top), 8px))',
      }}
    />

    <section className="flex min-h-0 flex-1 flex-col px-5 pt-5">
      {/* 질문 카드 자리 */}
      <div className="w-full rounded-[28px] rounded-tl-md bg-card px-6 py-6 shadow-lg shadow-black/5">
        <div className={`h-5 w-3/4 rounded-md ${BLOCK_CLASS}`} />
        <div className={`mt-3 h-5 w-1/2 rounded-md ${BLOCK_CLASS}`} />
      </div>
      {/* 내 답변 자리 */}
      <div className={`mt-4 min-h-28 w-full rounded-2xl ${BLOCK_CLASS}`} />
    </section>

    {/* 마이크 자리 */}
    <footer className="flex-none pb-[max(var(--safe-area-inset-bottom),16px)]">
      <div className="flex h-36 flex-col items-center justify-center">
        <div className={`size-20 rounded-full ${BLOCK_CLASS}`} />
      </div>
    </footer>
  </main>
);
