// 대화 화면 왼쪽 위 닫기(X) — 대기 화면과 본편이 같은 자리·모양을 쓰게 한 곳에서 그린다
'use client';

import { CloseIcon } from '@/shared/ui/Icons';

interface ExitHeaderProps {
  label: string;
  onExit: () => void;
  // 나가는 중이면 다시 누르지 못하게 한다
  disabled?: boolean;
}

export const ExitHeader = ({ label, onExit, disabled }: ExitHeaderProps) => (
  <header
    className="absolute inset-x-0 top-0 z-20 flex items-center px-3"
    style={{ paddingTop: 'max(var(--safe-area-inset-top), 8px)' }}
  >
    <button
      onClick={onExit}
      disabled={disabled}
      className="flex size-10 items-center justify-center text-foreground transition-transform active:scale-90"
      aria-label={label}
    >
      <CloseIcon size={24} />
    </button>
  </header>
);
