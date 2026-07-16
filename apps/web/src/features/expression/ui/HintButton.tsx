'use client';

// 힌트 버튼 — 한 번 누르면 힌트, 한 번 더 누르면 정답. 두 단계를 다 쓰면 사라진다 (퀴즈·복습 공용)
export const HintButton = ({
  step,
  onAdvance,
  keepFocus = false,
}: {
  step: number;
  onAdvance: () => void;
  // 숨은 입력의 포커스를 뺏지 않아야 할 때(복습 영작) — 키보드가 유지된다
  keepFocus?: boolean;
}) => {
  if (step >= 2) return null;
  return (
    <button
      type="button"
      onPointerDown={keepFocus ? (event) => event.preventDefault() : undefined}
      onClick={onAdvance}
      className="text-sm font-semibold text-muted-foreground underline underline-offset-4 transition-colors active:text-foreground"
    >
      {step === 0 ? '힌트 보기' : '정답 보기'}
    </button>
  );
};
