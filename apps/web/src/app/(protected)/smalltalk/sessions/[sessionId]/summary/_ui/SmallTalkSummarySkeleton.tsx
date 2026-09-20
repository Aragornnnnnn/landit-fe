// 오늘의 스몰톡 로딩 스켈레톤 — 말풍선과 비교 카드 자리를 먼저 잡아, 도착 후 화면이 튀지 않게 한다
export const SmallTalkSummarySkeleton = () => (
  <div
    role="status"
    aria-label="오늘의 스몰톡을 불러오는 중"
    className="min-h-0 flex-1 animate-pulse overflow-hidden px-5"
  >
    {/* 래디 + 말풍선 자리 */}
    <div className="flex items-center gap-3 pt-2">
      <div className="size-20 shrink-0 rounded-full bg-secondary" />
      <div className="flex-1 rounded-2xl bg-secondary px-4 py-3">
        <div className="h-4 w-4/5 rounded bg-card" />
        <div className="mt-2 h-4 w-3/5 rounded bg-card" />
      </div>
    </div>

    {/* 비교 카드 자리 — 지표 셋, 막대 둘씩 */}
    <div className="mt-5 rounded-2xl bg-card px-5 py-4 shadow-sm">
      <div className="h-5 w-24 rounded bg-secondary" />
      {[0, 1, 2].map((row) => (
        <div key={row} className="mt-4">
          <div className="h-3 w-16 rounded bg-secondary" />
          <div className="mt-2 h-2 w-3/5 rounded-full bg-secondary" />
          <div className="mt-2 h-2 w-4/5 rounded-full bg-secondary" />
        </div>
      ))}
    </div>
  </div>
);
