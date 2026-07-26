// 표현 리스트 로딩 스켈레톤 — ExpressionList와 같은 골격(진행바 + 항목)
export const ExpressionListSkeleton = () => (
  <div className="animate-pulse px-5 pt-2">
    <div className="mb-5">
      <div className="flex items-baseline justify-between">
        <div className="h-6 w-24 rounded-lg bg-secondary" />
        <div className="h-4 w-14 rounded-lg bg-secondary" />
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-secondary" />
    </div>

    <div className="flex flex-col gap-1">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex items-center gap-3 px-2 py-3.5">
          <div className="size-8 shrink-0 rounded-full bg-secondary" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-secondary" />
            <div className="h-3 w-2/5 rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
