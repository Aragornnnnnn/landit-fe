// 단계를 밟는 화면(온보딩·설문·위젯 안내)의 머리 — 왼쪽 뒤로가기, 오른쪽에 진행 표시(점·막대)를 둔다
'use client';

import type { ReactNode } from 'react';

import { ChevronLeftIcon } from './Icons';

interface StepHeaderProps {
  onBack: () => void;
  // 첫 단계처럼 돌아갈 곳이 없으면 버튼을 감춘다 — 자리는 남겨 진행 표시가 흔들리지 않게
  backDisabled?: boolean;
  // 오른쪽 진행 표시
  children?: ReactNode;
}

export const StepHeader = ({
  onBack,
  backDisabled = false,
  children,
}: StepHeaderProps) => (
  <header
    className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5"
    style={{ paddingTop: 'max(var(--safe-area-inset-top), 18px)' }}
  >
    <button
      type="button"
      onClick={onBack}
      aria-label="이전"
      disabled={backDisabled}
      className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-opacity active:bg-black/5 disabled:opacity-0"
    >
      <ChevronLeftIcon size={28} strokeWidth={2.8} />
    </button>

    {children}
  </header>
);
