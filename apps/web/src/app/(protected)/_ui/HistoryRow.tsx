// 지난 기록 목록의 한 줄 — 제목·한 줄 설명·오른쪽 요약·화살표. 스몰톡과 시나리오 기록 두 화면이 함께 써서 (protected) 그룹 루트에 둔다
import type { ReactNode } from 'react';
import Link from 'next/link';

import { ChevronRightIcon } from '@/shared/ui/Icons';

const ROW_CLASS =
  'flex w-full items-center gap-3 rounded-2xl bg-card px-4.5 py-4 text-left shadow-sm transition-colors active:bg-secondary/40';

type HistoryRowProps = {
  title: ReactNode;
  meta: ReactNode;
  trailing?: ReactNode;
  // 화면 코드를 미리 받게 할 곳은 링크로, 이동 전에 할 일이 있으면 버튼으로 쓴다
} & ({ href: string } | { onClick: () => void });

export const HistoryRow = ({
  title,
  meta,
  trailing,
  ...target
}: HistoryRowProps) => {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-foreground">{title}</p>
        <p className="mt-1.5 text-13 font-medium text-muted-foreground">
          {meta}
        </p>
      </div>
      {trailing}
      <ChevronRightIcon size={16} className="text-muted-foreground/60" />
    </>
  );

  return 'href' in target ? (
    <Link href={target.href} className={ROW_CLASS}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={target.onClick} className={ROW_CLASS}>
      {content}
    </button>
  );
};

/** 목록이 오는 동안 안내문과 줄 자리를 먼저 잡아, 도착 후 목록이 튀지 않게 한다 */
export const HistoryListSkeleton = ({
  rows,
  label,
}: {
  rows: number;
  label: string;
}) => (
  <div
    role="status"
    aria-label={label}
    className="min-h-0 flex-1 animate-pulse overflow-hidden px-5 pb-[max(var(--safe-area-inset-bottom),24px)]"
  >
    <div className="mt-2 mb-4 h-5 w-3/4 rounded bg-secondary" />
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          className="flex items-center gap-3 rounded-2xl bg-card px-4.5 py-4 shadow-sm"
        >
          <div className="min-w-0 flex-1">
            <div className="h-6 w-1/2 rounded bg-secondary" />
            <div className="mt-1.5 h-[18px] w-1/2 rounded bg-secondary" />
          </div>
          <div className="h-4 w-14 shrink-0 rounded bg-secondary" />
        </div>
      ))}
    </div>
  </div>
);
