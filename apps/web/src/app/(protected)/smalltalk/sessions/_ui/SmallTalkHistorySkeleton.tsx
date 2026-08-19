// 지난 스몰톡 목록 로딩 스켈레톤 — 안내문과 대화 행 자리를 먼저 잡아, 도착 후 목록이 튀지 않게 한다
export const SmallTalkHistorySkeleton = () => (
  <div
    role="status"
    aria-label="지난 대화를 불러오는 중"
    className="min-h-0 flex-1 animate-pulse overflow-hidden px-5 pb-6"
  >
    {/* 안내문 자리 */}
    <div className="mt-2 mb-4 h-5 w-3/4 rounded bg-secondary" />

    {/* 대화 행 자리 — 제목, 날짜·시간, 오른쪽 표현 진행 표시 */}
    <div className="flex flex-col gap-2">
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          className="flex items-center gap-3 rounded-2xl bg-card px-4.5 py-4 shadow-sm"
        >
          <div className="min-w-0 flex-1">
            <div className="h-6 w-2/3 rounded bg-secondary" />
            <div className="mt-1.5 h-[18px] w-1/2 rounded bg-secondary" />
          </div>
          <div className="h-4 w-12 shrink-0 rounded bg-secondary" />
        </div>
      ))}
    </div>
  </div>
);
