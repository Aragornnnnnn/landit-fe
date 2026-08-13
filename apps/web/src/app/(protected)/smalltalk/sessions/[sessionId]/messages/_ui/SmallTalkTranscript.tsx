'use client';

// 그날 주고받은 말 — 대화였으니 대화처럼 보여야 그때가 떠오른다.
// 대화 화면의 말풍선은 TTS·마이크가 얽혀 있어 여기서는 읽기 전용으로 새로 그린다
import { useRouter } from 'next/navigation';

import type { SmallTalkHistoryMessage } from '@/features/small-talk/api/small-talk';
import { toSessionTitle } from '@/features/small-talk/lib/session-summary';
import { useSmallTalkSessionQuery } from '@/features/small-talk/model/useSmallTalkSessionQuery';
import { smallTalkHistoryPath } from '@/shared/lib/routes';
import { ChevronLeftIcon } from '@/shared/ui/Icons';

export const SmallTalkTranscript = ({ sessionId }: { sessionId: number }) => {
  const router = useRouter();
  const { session, error, isLoading } = useSmallTalkSessionQuery(sessionId);

  return (
    <main
      className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <header className="relative flex h-14 flex-none items-center justify-center">
        <button
          onClick={() => router.replace(smallTalkHistoryPath(sessionId))}
          className="absolute left-3 flex size-10 items-center justify-center text-foreground"
          aria-label="뒤로"
        >
          <ChevronLeftIcon size={24} />
        </button>
        <h1 className="truncate px-14 text-[17px] font-bold text-foreground">
          {session ? toSessionTitle(session.title, session.completedAt) : ''}
        </h1>
      </header>

      {error ? (
        <p className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {error.message || '대화를 불러오지 못했어요.'}
        </p>
      ) : isLoading ? (
        <p
          role="status"
          className="flex flex-1 items-center justify-center text-sm text-muted-foreground"
        >
          대화를 불러오는 중이에요
        </p>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pt-2 pb-8">
          {session?.messages.map((message) => (
            <li key={message.messageId}>
              <MessageBubble message={message} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};

// 상대 말은 왼쪽에 번역까지, 내 말은 오른쪽에 원문만 — 내가 한 말은 번역이 필요 없다
const MessageBubble = ({ message }: { message: SmallTalkHistoryMessage }) => {
  const mine = message.role === 'USER';

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 ${
          mine ? 'bg-primary text-white' : 'bg-card shadow-sm'
        }`}
      >
        <p
          className={`text-[15px] leading-6 font-medium ${mine ? '' : 'text-foreground'}`}
        >
          {message.content}
        </p>
        {!mine && message.translatedContent && (
          <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">
            {message.translatedContent}
          </p>
        )}
      </div>
    </div>
  );
};
