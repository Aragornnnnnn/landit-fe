'use client';

// 선택지 목록 — 화면을 넘치면 안에서 스크롤하고, 아래에 더 있는 동안 끝을 흐려 더 있다는 것을 보여 준다
import { useEffect, useRef, useState, type ReactNode } from 'react';

// 소수점 스크롤로 끝에서 1px쯤 모자라도 끝까지 내린 것으로 본다
const SCROLL_END_TOLERANCE_PX = 2;

export const ChoiceList = ({
  role,
  titleId,
  className = '',
  children,
}: {
  role: 'group' | 'radiogroup';
  titleId: string;
  className?: string;
  children: ReactNode;
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);

  const measureMoreBelow = () => {
    const list = listRef.current;
    if (!list) return;
    setMoreBelow(
      list.scrollHeight - list.scrollTop - list.clientHeight >
        SCROLL_END_TOLERANCE_PX,
    );
  };

  // 기타 입력칸이 열리면 내용이 늘어난다 — 렌더마다 다시 잰다
  useEffect(measureMoreBelow);

  useEffect(() => {
    window.addEventListener('resize', measureMoreBelow);
    return () => window.removeEventListener('resize', measureMoreBelow);
  }, []);

  return (
    <div className={`relative flex min-h-0 flex-1 flex-col ${className}`}>
      <div
        ref={listRef}
        role={role}
        aria-labelledby={titleId}
        onScroll={measureMoreBelow}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-1"
      >
        {children}
      </div>
      {moreBelow && (
        <div
          aria-hidden
          data-testid="choice-list-more"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-background to-transparent"
        />
      )}
    </div>
  );
};
