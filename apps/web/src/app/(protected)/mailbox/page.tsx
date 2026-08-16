'use client';

// 편지함(/mailbox) — 받은 편지와 보낸 편지를 한 화면에서 오간다. 어느 칸인지는 ?box=로 넘긴다
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { readBoxParam } from '@/features/mailbox/model/box';
import { MailboxFlow } from '@/features/mailbox/ui/MailboxFlow';

import { AppHeader } from '../_ui/AppHeader';

// useSearchParams는 프리렌더 시 Suspense 경계가 필요하다
export default function MailboxPage() {
  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <AppHeader />
      <Suspense>
        <MailboxContent />
      </Suspense>
    </main>
  );
}

function MailboxContent() {
  return <MailboxFlow box={readBoxParam(useSearchParams())} />;
}
