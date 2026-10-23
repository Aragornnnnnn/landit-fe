// 말하는 동안 아직 확정되지 않은 말이 있다는 걸 알리는 점 세 개 — 물결처럼 차례로 떠오른다
// spaced는 앞에 글자가 있을 때 — 마지막 단어에 붙지 않게 한 칸 띄운다
export const ListeningDots = ({ spaced }: { spaced: boolean }) => (
  <span
    role="img"
    aria-label="듣는 중"
    className={`inline-flex h-[1em] items-end gap-1 ${spaced ? 'ml-2.5' : ''}`}
  >
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="animate-listening-wave size-1.5 rounded-full bg-muted-foreground"
        style={{ '--i': i } as React.CSSProperties}
      />
    ))}
  </span>
);
