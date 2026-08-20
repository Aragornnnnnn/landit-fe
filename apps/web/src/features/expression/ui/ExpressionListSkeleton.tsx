// 표현 리스트 로딩 스켈레톤 — ExpressionList와 같은 골격(제목·진행바 + 카드 항목).
// 행 수는 자리에 맞춘다 — 시나리오는 다섯 개 안팎, 스몰톡은 둘이라 같은 수로 그리면 도착 후 목록이 줄어든다
export const ExpressionListSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="animate-pulse px-5 pt-2">
    {/* 제목·완료 수 + 진행바 자리 (ExpressionList 헤더와 같은 높이) */}
    <div className="mb-5">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="h-5 w-24 rounded-lg bg-secondary" />
        <div className="h-5 w-14 rounded-lg bg-secondary" />
      </div>
      <div className="h-2 w-full rounded-full bg-secondary" />
    </div>

    {/* 항목 자리 — 실제 항목(rounded-2xl 카드, 원형 배지, 두 줄)과 같은 패딩·높이 */}
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          className="flex items-center gap-3 rounded-2xl bg-secondary/40 px-3.5 py-3.5"
        >
          <div className="size-8 shrink-0 rounded-full bg-secondary" />
          <div className="flex-1">
            <div className="h-6 w-2/3 rounded bg-secondary" />
            <div className="mt-0.5 h-5 w-2/5 rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
