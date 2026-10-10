// 환급 화면 로딩 스켈레톤 — 그림·금액·오늘 세 칸 자리를 먼저 잡아, 도착 후 화면이 튀지 않게 한다
export const RefundSkeleton = () => (
  <div
    role="status"
    aria-label="환급 정보를 불러오는 중"
    className="animate-pulse px-5 pt-4 pb-8"
  >
    <div className="flex flex-col items-center">
      {/* 돈통 그림 자리 */}
      <div className="h-[180px] w-[240px] rounded-3xl bg-secondary" />
      {/* 꼬리표, 금액, 안내 문구 자리 */}
      <div className="mt-3 h-4 w-20 rounded bg-secondary" />
      <div className="mt-2 h-10 w-40 rounded bg-secondary" />
      <div className="mt-2.5 h-5 w-52 rounded bg-secondary" />
    </div>

    {/* 오늘 세 칸 자리 */}
    <div className="mt-5 grid grid-cols-3 gap-2">
      {[0, 1, 2].map((tile) => (
        <div key={tile} className="h-[104px] rounded-2xl bg-secondary" />
      ))}
    </div>
  </div>
);
