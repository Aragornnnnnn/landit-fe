'use client';

// 편지함(/mailbox) — 받은 편지와 보낸 편지를 한 화면에서 오간다. 어느 칸인지는 ?box=로 넘긴다
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { readBoxParam } from '@/features/mailbox/model/box';
import { MailboxFlow } from '@/features/mailbox/ui/MailboxFlow';
import { homePath } from '@/shared/lib/last-tab';
import { BackHeader } from '@/shared/ui/BackHeader';

// useSearchParams는 프리렌더 시 Suspense 경계가 필요하다
export default function MailboxPage() {
  const router = useRouter();

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      {/* 스트릭·내 정보처럼 홈에서 밀려 올라온 화면이라 뒤로가기 머리를 쓴다.
          되짚기(back)가 아니라 보던 탭으로 보내는 건, 알림 딥링크처럼 히스토리 없는 진입에서도 막다르지 않게 */}
      <BackHeader title="편지함" onBack={() => router.replace(homePath())} />
      <Suspense>
        <MailboxContent />
      </Suspense>
    </main>
  );
}

function MailboxContent() {
  return <MailboxFlow box={readBoxParam(useSearchParams())} />;
}
