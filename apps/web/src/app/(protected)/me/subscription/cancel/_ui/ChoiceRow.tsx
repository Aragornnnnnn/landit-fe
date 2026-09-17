'use client';

// 사유·방법 라디오 한 행 — 왼쪽 토스페이스 이모지, 가운데 문구, 오른쪽 동그라미. 하나만 고르는 자리라 role은 radio
import { Emoji } from '@/shared/ui/emoji';

interface ChoiceRowProps {
  emoji: string;
  label: string;
  checked: boolean;
  onSelect: () => void;
}

export const ChoiceRow = ({
  emoji,
  label,
  checked,
  onSelect,
}: ChoiceRowProps) => (
  <button
    type="button"
    role="radio"
    aria-checked={checked}
    onClick={onSelect}
    className={`flex min-h-[54px] w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
      checked ? 'border-primary bg-selected' : 'border-border bg-card'
    }`}
  >
    <Emoji className="text-[22px]">{emoji}</Emoji>
    <span className="flex-1 text-[15px] font-semibold text-foreground">
      {label}
    </span>
    <span
      aria-hidden
      className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
        checked ? 'border-primary' : 'border-border'
      }`}
    >
      {checked && <span className="size-2.5 rounded-full bg-primary" />}
    </span>
  </button>
);
