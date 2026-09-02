'use client';

// 선택지 카드 — 영어 수준 카드와 같은 납작한 흰 카드 + 아래 엣지. 고르면 틴트 배경으로 눌린 채 머문다
import { CheckIcon } from '@/shared/ui/Icons';

export const ChoiceCard = ({
  label,
  selected,
  check = false,
  onSelect,
}: {
  label: string;
  selected: boolean;
  // 복수 선택은 오른쪽에 체크 동그라미를 둬서 여러 개 고를 수 있음을 보여준다
  check?: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={selected}
    className={`flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left transition-[translate,box-shadow,background-color] duration-75 ${
      selected
        ? 'translate-y-[3px] bg-primary/15 shadow-none'
        : 'bg-card shadow-[0_3px_0_var(--border)] active:translate-y-[3px] active:shadow-none'
    }`}
  >
    <span className="text-base font-extrabold text-foreground">{label}</span>
    {check && (
      <span
        aria-hidden
        className={`flex size-6 shrink-0 items-center justify-center rounded-full transition-colors ${
          selected ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        }`}
      >
        {selected && <CheckIcon size={14} strokeWidth={3} />}
      </span>
    )}
  </button>
);
