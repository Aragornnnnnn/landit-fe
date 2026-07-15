// 피드백 총평 로딩 스켈레톤 — FeedbackSummary와 같은 골격 (대개 미리 생성돼 잠깐만 보인다)
export const FeedbackSkeleton = () => (
  <div className="mx-auto flex h-dvh max-w-[430px] animate-pulse flex-col bg-background">
    <header
      className="flex items-center gap-2 border-b border-border px-4 pt-4 pb-3"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      <div className="h-6 w-[21px] rounded bg-secondary" />
      <div className="mx-auto h-6 w-32 rounded-lg bg-secondary" />
      <span className="w-7" />
    </header>

    <div className="flex flex-1 flex-col px-6 pt-[18px] pb-6">
      {/* 별점 + 해석 헤드라인 */}
      <div className="flex flex-col gap-3">
        <div className="h-8 w-40 rounded-lg bg-secondary" />
        <div className="h-6 w-full rounded-lg bg-secondary" />
        <div className="h-6 w-3/4 rounded-lg bg-secondary" />
      </div>

      {/* 점수 트랙 */}
      <div className="mt-5 h-3 w-full rounded-full bg-secondary" />

      {/* 이번 대화에서 — 카드 3줄 */}
      <div className="mt-8 mb-3 h-6 w-28 rounded-lg bg-secondary" />
      <div className="flex flex-col gap-4 rounded-2xl bg-primary/[0.06] p-5">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex flex-col gap-2">
            <div className="h-3 w-16 rounded bg-secondary" />
            <div className="h-5 w-full rounded-lg bg-secondary" />
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        className="mt-auto pt-8"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        <div className="h-14 w-full rounded-xl bg-secondary" />
      </div>
    </div>
  </div>
);
