// 시나리오 카드 로딩 스켈레톤 — ScenarioCard와 같은 골격
export const ScenarioCardSkeleton = () => (
  <div className="min-h-0 flex-1 px-5 py-3">
    <div className="flex h-full w-full animate-pulse flex-col overflow-hidden rounded-2xl bg-card shadow-md">
      <div className="min-h-0 flex-1 bg-secondary" />
      <div className="flex flex-none flex-col gap-3 px-5 pt-4 pb-5">
        <div className="h-7 w-48 rounded-lg bg-secondary" />
        <div className="h-5 w-full rounded-lg bg-secondary" />
        <div className="mt-1 h-14 w-full rounded-xl bg-secondary" />
      </div>
    </div>
  </div>
);
