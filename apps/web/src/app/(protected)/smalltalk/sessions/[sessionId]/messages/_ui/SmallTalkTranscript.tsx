'use client';

// 그날 주고받은 말 — 대화였으니 대화처럼 보여야 그때가 떠오른다.
// 대화 화면의 말풍선은 TTS·마이크가 얽혀 있어 여기서는 읽기 전용으로 새로 그린다.
// 대화 중엔 교정을 보여주지 않는 대신, 여기서 내 말풍선 아래에 더 자연스러운 말과 배운 표현 재사용을 붙인다
import { useRouter } from 'next/navigation';

import type {
  SmallTalkCorrection,
  SmallTalkHistoryMessage,
  SmallTalkReusedExpression,
} from '@/features/small-talk/api/small-talk';
import { toSessionTitle } from '@/features/small-talk/lib/session-summary';
import { splitMatchedText } from '@/features/small-talk/model/message-feedback';
import { useSmallTalkSessionQuery } from '@/features/small-talk/model/useSmallTalkSessionQuery';
import { smallTalkHistoryPath } from '@/shared/lib/routes';
import { Emoji } from '@/shared/ui/emoji';
import { CheckIcon, ChevronLeftIcon } from '@/shared/ui/Icons';

import { SmallTalkTranscriptSkeleton } from './SmallTalkTranscriptSkeleton';

export const SmallTalkTranscript = ({ sessionId }: { sessionId: number }) => {
  const router = useRouter();
  // 교정은 대화가 끝난 뒤 따로 만들어진다 — 이 화면이 그걸 그리므로 준비될 때까지 기다린다
  const { session, error, isLoading, waitExpired } = useSmallTalkSessionQuery(
    sessionId,
    { awaitCorrections: true },
  );

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
        <SmallTalkTranscriptSkeleton />
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pt-2 pb-8">
          {session?.messages.map((message) => (
            <li key={message.messageId}>
              {message.role === 'USER' ? (
                <MyMessage message={message} waitExpired={waitExpired} />
              ) : (
                <PartnerMessage message={message} />
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};

// 상대 말은 왼쪽에 번역까지 — 교정·표현 재사용은 내 말에만 있는 것이라 여기엔 아무것도 안 붙는다
const PartnerMessage = ({ message }: { message: SmallTalkHistoryMessage }) => (
  <div className="flex justify-start">
    <div className="max-w-[78%] rounded-2xl bg-card px-4 py-3 shadow-sm">
      <p className="text-[15px] leading-6 font-medium text-foreground">
        {message.content}
      </p>
      {message.translatedContent && (
        <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">
          {message.translatedContent}
        </p>
      )}
    </div>
  </div>
);

// 내 말은 오른쪽에 원문만 — 내가 한 말은 번역이 필요 없다.
// 그 아래에 배운 표현 태그 → (교정을 아직 만드는 중이면 찾는 중 한 줄) → 교정 카드 순으로 붙는다.
// 고칠 게 없는 말풍선엔 아무것도 없다
const MyMessage = ({
  message,
  waitExpired,
}: {
  message: SmallTalkHistoryMessage;
  // 상한까지 기다려 더는 묻지 않는 상태 — 찾는 중 표시를 거둔다. 만들어지면 다음에 들어올 때 보인다
  waitExpired: boolean;
}) => (
  <div className="flex flex-col items-end gap-1.5">
    <div className="max-w-[78%] rounded-2xl bg-primary px-4 py-3 text-white">
      <p className="text-[15px] leading-6 font-medium">
        <HighlightedContent
          content={message.content}
          matchedText={message.reusedExpression?.matchedText}
        />
      </p>
    </div>
    {message.reusedExpression && (
      <ReusedExpressionTag expression={message.reusedExpression} />
    )}
    {message.correctionStatus === 'PREPARING' && !waitExpired && (
      <p className="text-[12px] text-muted-foreground">
        더 자연스러운 말을 찾는 중…
      </p>
    )}
    {message.correction && <CorrectionCard correction={message.correction} />}
  </div>
);

// 배운 표현을 쓴 구절만 밑줄 — 구절을 못 찾으면 원문 그대로
const HighlightedContent = ({
  content,
  matchedText,
}: {
  content: string;
  matchedText?: string;
}) => {
  const split = splitMatchedText(content, matchedText);
  if (!split) return content;

  return (
    <>
      {split.before}
      <u className="underline decoration-2 underline-offset-4">{split.match}</u>
      {split.after}
    </>
  );
};

// 말풍선 아래 연초록 한 줄 — 배운 표현을 실제로 썼다는 표시
const ReusedExpressionTag = ({
  expression,
}: {
  expression: SmallTalkReusedExpression;
}) => (
  <p className="flex items-center gap-1 rounded-lg bg-success/10 px-2.5 py-1 text-[12px] font-semibold text-success">
    <CheckIcon size={12} strokeWidth={3} />
    배운 표현 「{expression.text}」을 썼어요
  </p>
);

// 더 자연스러운 말 — 고친 문장은 초록 굵게, 이유는 회색.
// 장기기억을 근거로 고쳤으면 그 근거를 날짜 태그로 보여준다
const CorrectionCard = ({
  correction,
}: {
  correction: SmallTalkCorrection;
}) => (
  <section className="max-w-[85%] rounded-2xl border border-success/20 bg-success/10 px-4 py-3">
    <p className="text-[12px] font-semibold text-success">
      <Emoji>✨</Emoji> 이렇게 말하면 더 자연스러워요
    </p>
    <p className="mt-1.5 text-[15px] leading-6 font-bold text-success">
      {correction.betterSentence}
    </p>
    <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">
      {correction.reason}
    </p>
    {correction.memoryTag && (
      <p className="mt-2 inline-block rounded-md bg-card px-2 py-0.5 text-[12px] text-muted-foreground">
        <Emoji>🗓️</Emoji> {correction.memoryTag}
      </p>
    )}
  </section>
);
