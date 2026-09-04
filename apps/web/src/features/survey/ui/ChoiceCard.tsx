'use client';

// 선택지 카드 — 영어 수준 카드와 같은 납작한 흰 카드 + 아래 엣지. 고르면 틴트 배경으로 눌린 채 머문다.
// 하나만 고르는 문항은 radio, 여러 개 고르는 문항은 checkbox 역할로 — 화면 낭독기가 "하나만"인지 알게
import { CheckIcon } from '@/shared/ui/Icons';

export const ChoiceCard = ({
  role,
  label,
  checked,
  onSelect,
}: {
  role: 'radio' | 'checkbox';
  label: string;
  checked: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    role={role}
    aria-checked={checked}
    onClick={onSelect}
    className={`flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left transition-[translate,box-shadow,background-color] duration-75 ${
      checked
        ? 'translate-y-[3px] bg-selected shadow-none'
        : 'bg-card shadow-[0_3px_0_var(--border)] active:translate-y-[3px] active:shadow-none'
    }`}
  >
    <span className="text-base font-extrabold text-foreground">{label}</span>
    {/* 체크 동그라미는 여러 개 고를 수 있다는 표시 — 하나만 고르는 카드엔 없다 */}
    {role === 'checkbox' && (
      <span
        aria-hidden
        className={`flex size-6 shrink-0 items-center justify-center rounded-full transition-colors ${
          checked ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        }`}
      >
        {checked && <CheckIcon size={14} strokeWidth={3} />}
      </span>
    )}
  </button>
);
