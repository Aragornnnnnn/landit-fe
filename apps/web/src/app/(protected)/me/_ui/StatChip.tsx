// 프로필 아래 작은 통계 카드 (연습 횟수, 로그인 방식)
export function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-col rounded-xl px-3.5 py-2.5"
      style={{ background: '#fff', minWidth: 80 }}
    >
      <span className="text-[11px]" style={{ color: '#999' }}>
        {label}
      </span>
      <span
        className="mt-0.5 text-[15px] font-semibold"
        style={{ color: '#111' }}
      >
        {value}
      </span>
    </div>
  );
}
