// 종료 후 잡을 기다리는 블록의 자리 — 카드 한 장 높이를 잡아 두고, 무엇을 기다리는지는 보조 기술에만 말한다
export const BlockSkeleton = ({ label }: { label: string }) => (
  <div
    role="status"
    aria-label={label}
    className="animate-pulse rounded-2xl bg-card px-5 py-4 shadow-sm"
  >
    <div className="h-4 w-40 rounded bg-secondary" />
    <div className="mt-3 h-16 rounded-xl bg-secondary" />
  </div>
);
