'use client';

// 스몰톡 대화 페이지 — 주소에 실린 "누구와 어떻게 시작할지"로 대화를 연다.
// 가리킬 콘텐츠가 없어 id가 없고, 대신 상대·시작 방식·주제가 쿼리로 온다
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { ConversationSkeleton } from '@/features/conversation/ui/ConversationSkeleton';
import { toPartnerId } from '@/features/small-talk/model/partner';

import { SmallTalkFlow } from './_ui/SmallTalkFlow';

// useSearchParams는 프리렌더 시 Suspense 경계가 필요하다
export default function SmallTalkPage() {
  return (
    <Suspense fallback={<ConversationSkeleton />}>
      <SmallTalkContent />
    </Suspense>
  );
}

function SmallTalkContent() {
  const searchParams = useSearchParams();
  // 주제를 고르고 들어오면 상대가 먼저(ai_first), 직접 걸면 내가 먼저다. 주제 없이 온 ai_first는 성립하지 않는다
  const topicId = Number(searchParams.get('topicId'));
  const hasTopic = Number.isSafeInteger(topicId) && topicId > 0;
  const aiFirst = searchParams.get('mode') === 'ai_first' && hasTopic;

  return (
    <SmallTalkFlow
      startMode={aiFirst ? 'AI_FIRST' : 'USER_FIRST'}
      topicId={aiFirst ? topicId : undefined}
      partner={toPartnerId(searchParams.get('partner'))}
    />
  );
}
