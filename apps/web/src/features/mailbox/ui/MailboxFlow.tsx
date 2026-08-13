'use client';

// 편지함 화면 — 받은/보낸 칸을 오가며 편지 목록을 본다. 헤더는 페이지가 얹는다
import { EVENTS } from '@landit/analytics';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';
import { RetryNotice } from '@/shared/ui/RetryNotice';

import { letterPath, mailboxPath, type MailboxBox } from '../model/box';
import type { LetterRow } from '../model/letter-row';
import { useLetterRowsQuery } from '../model/useLetterRowsQuery';
import { COMPOSE_FAB_CLEARANCE, ComposeFab } from './list/ComposeFab';
import { LetterListItem } from './list/LetterListItem';
import { MailboxEmpty } from './list/MailboxEmpty';
import { MailboxTabs } from './MailboxTabs';

export const MailboxFlow = ({ box }: { box: MailboxBox }) => {
  const router = useRouter();

  // 주소가 정본이다 — 상세를 보고 뒤로 오면 보던 칸으로 돌아온다.
  // replace라 뒤로가기가 칸 되감기가 되지 않고, scroll:false라 목록이 맨 위로 튀지 않는다
  const openBox = (next: MailboxBox) => {
    track(EVENTS.MAILBOX_TAB_SWITCHED, { box: next });
    router.replace(mailboxPath(next), { scroll: false });
  };

  return (
    <>
      <MailboxTabs current={box} onSelect={openBox} />

      {/* FAB이 목록 위에 떠 있어야 해서 둘을 한 상자에 넣는다 — 기준이 화면이 아니라 앱 컬럼이다 */}
      <div className="relative flex-1 overflow-hidden">
        {/* 마지막 편지가 FAB 뒤로 숨지 않게 아래를 띄운다 — 값의 근거는 ComposeFab의 크기다 */}
        <div className={`h-full overflow-y-auto ${COMPOSE_FAB_CLEARANCE}`}>
          <LetterBox box={box} />
        </div>

        <ComposeFab />
      </div>
    </>
  );
};

// 한 칸의 속살 — 목록이 있으면 목록이 이긴다. 칸을 옮기다 실패해도 보고 있던 목록은 그대로 둔다
const LetterBox = ({ box }: { box: MailboxBox }) => {
  const { rows, isPending, error, retry } = useLetterRowsQuery(box);

  if (rows) {
    return rows.length > 0 ? (
      <LetterList rows={rows} />
    ) : (
      <MailboxEmpty box={box} />
    );
  }
  if (error) {
    return (
      <RetryNotice screen="mailbox" message={error.message} onRetry={retry} />
    );
  }
  return isPending ? <Skeleton /> : null;
};

// 구분선으로만 나눈다 — 편지가 쌓여도 카드가 겹겹이 놓인 것처럼 답답해지지 않는다
const LetterList = ({ rows }: { rows: LetterRow[] }) => (
  <ul className="divide-y divide-border px-5">
    {rows.map((row) => (
      <li key={row.letterId}>
        <Link href={letterPath(row.letterId)} className="block">
          <LetterListItem row={row} />
        </Link>
      </li>
    ))}
  </ul>
);

// 실제 줄과 같은 높이의 회색 덩어리 — 도착 후 목록이 튀어 오르지 않게 자리를 먼저 잡는다
const Skeleton = () => (
  <div className="animate-pulse px-5">
    {[0, 1, 2].map((row) => (
      <div key={row} className="py-4">
        <div className="h-[21px] w-11 rounded-full bg-secondary" />
        <div className="mt-2.5 h-[18px] w-2/3 rounded-md bg-secondary" />
        <div className="mt-1.5 h-4 w-full rounded-md bg-secondary" />
      </div>
    ))}
  </div>
);
