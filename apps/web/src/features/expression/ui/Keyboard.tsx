'use client';

// 커스텀 영어 자판(QWERTY) — OS 키보드 대신 화면에 직접 그린다. 확인 키를 자판에 통합(레퍼런스식).
// 실제 키보드처럼 가장자리까지 채우고, 스페이스바는 단어 조기 구분용(단어가 다 차면 자동으로 넘어가지만 짧게 끊고 싶을 때 쓴다).
import { useEffect, useRef } from 'react';

import { BackspaceIcon, CheckIcon } from '@/shared/ui/Icons';

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

const KEY =
  'flex h-11 items-center justify-center rounded-md text-lg font-semibold ' +
  'shadow-[0_1px_0_var(--border)] transition-[translate,box-shadow] duration-75 active:translate-y-[1px] active:shadow-none';

interface KeyboardProps {
  onKey: (letter: string) => void;
  onSpace: () => void;
  onBackspace: () => void;
  onConfirm: () => void;
  canConfirm: boolean;
}

export const Keyboard = ({
  onKey,
  onSpace,
  onBackspace,
  onConfirm,
  canConfirm,
}: KeyboardProps) => {
  // 삭제 버튼 꾹 누르면 연속 삭제 — 실제 키보드처럼 초기 딜레이(400ms) 후 반복(55ms)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRepeat = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (repeatTimer.current) clearInterval(repeatTimer.current);
    holdTimer.current = null;
    repeatTimer.current = null;
  };

  const startBackspace = () => {
    onBackspace();
    holdTimer.current = setTimeout(() => {
      repeatTimer.current = setInterval(onBackspace, 55);
    }, 400);
  };

  useEffect(() => stopRepeat, []);

  return (
    <div className="flex flex-col gap-1.5 bg-secondary px-1 pt-2 pb-5">
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1">
          {row.split('').map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => onKey(letter)}
              className={`${KEY} w-8 bg-card text-foreground`}
            >
              {letter}
            </button>
          ))}
          {rowIndex === 2 && (
            <button
              type="button"
              onPointerDown={startBackspace}
              onPointerUp={stopRepeat}
              onPointerLeave={stopRepeat}
              onPointerCancel={stopRepeat}
              aria-label="지우기"
              className={`${KEY} w-11 bg-muted text-muted-foreground`}
            >
              <BackspaceIcon size={22} />
            </button>
          )}
        </div>
      ))}

      {/* 하단 — 스페이스바 + 확인 (레퍼런스처럼 자판에 통합) */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onSpace}
          aria-label="띄어쓰기"
          className={`${KEY} flex-1 bg-card text-foreground`}
        >
          <span className="h-0.5 w-10 rounded-full bg-muted-foreground/40" />
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canConfirm}
          className={`${KEY} w-28 gap-1 ${
            canConfirm
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground/50'
          }`}
        >
          <CheckIcon size={18} /> 확인
        </button>
      </div>
    </div>
  );
};
