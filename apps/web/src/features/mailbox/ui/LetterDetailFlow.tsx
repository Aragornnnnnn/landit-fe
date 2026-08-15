'use client';

// 편지 한 통을 펼쳐 보는 화면 — 받은 편지와 보낸 피드백이 리소스가 달라 화면도 둘로 갈린다.
// 겉모습(헤더·제목·칩·시각)은 같아서 그 골격만 여기서 공유한다
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { useScrollShadow } from '@/shared/lib/useScrollShadow';
import { BackHeader } from '@/shared/ui/BackHeader';
import { RetryNotice } from '@/shared/ui/RetryNotice';

import type {
  ReceivedLetterDetail,
  SentFeedbackDetail,
} from '../api/letter-detail';
import { formatLetterDateTime } from '../lib/letter-date';
import { mailboxPath, type MailboxBox } from '../model/box';
import { readLetterBlocks } from '../model/letter-blocks';
import {
  toReceivedHead,
  toSentHead,
  type LetterHead,
} from '../model/letter-detail-head';
import {
  useReceivedLetterQuery,
  useSentFeedbackQuery,
} from '../model/useLetterDetailQuery';
import { LetterBlocks } from './detail/LetterBlocks';
import { QuotedLetter } from './detail/QuotedLetter';
import { WaitingNotice } from './detail/WaitingNotice';
import { LetterBadge } from './LetterBadge';

// 받은 편지 — 공지·업데이트는 블록 본문, 답장은 글 한 덩이에 내가 보낸 내용이 따라붙는다
export const ReceivedLetterFlow = ({ letterId }: { letterId: number }) => {
  const { letter, isPending, error, retry } = useReceivedLetterQuery(letterId);

  return (
    <LetterShell
      box="received"
      isPending={isPending}
      error={error}
      onRetry={retry}
      head={letter && toReceivedHead(letter)}
      sentAt={letter?.sentAt ?? null}
    >
      {letter && <ReceivedBody letter={letter} />}
    </LetterShell>
  );
};

// 보낸 피드백 — 내가 쓴 글이 먼저고, 답장이 도착했으면 그 아래에 붙는다
export const SentFeedbackFlow = ({ feedbackId }: { feedbackId: number }) => {
  const { letter, isPending, error, retry } = useSentFeedbackQuery(feedbackId);

  return (
    <LetterShell
      box="sent"
      isPending={isPending}
      error={error}
      onRetry={retry}
      head={letter && toSentHead(letter)}
      sentAt={letter?.createdAt ?? null}
    >
      {letter && <SentBody feedback={letter} />}
    </LetterShell>
  );
};

const LetterShell = ({
  box,
  head,
  sentAt,
  isPending,
  error,
  onRetry,
  children,
}: {
  box: MailboxBox;
  head: LetterHead | null;
  sentAt: string | null;
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  children: ReactNode;
}) => {
  const router = useRouter();
  const { ref: scrollRef, onScroll, hasShadow } = useScrollShadow();

  // 편지가 있던 칸으로 돌려보낸다. 되짚기(back)로 두면 알림 딥링크처럼 히스토리가
  // 없는 진입에서 화살표가 아무 일도 하지 않는 막다른 화면이 된다
  const backToBox = () => router.replace(mailboxPath(box));

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <BackHeader hasShadow={hasShadow} onBack={backToBox} />

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-5 pb-10"
      >
        {/* 편지가 있으면 편지가 이긴다 — 다시 불러오다 실패해도 보고 있던 편지는 그대로 둔다 */}
        {head && sentAt ? (
          <article>
            <h1 className="text-xl leading-snug font-bold text-foreground">
              {head.title}
            </h1>
            <div className="mt-3 flex items-center gap-2">
              <LetterBadge label={head.badge.label} tone={head.badge.tone} />
              <time className="text-[13px] text-muted-foreground">
                {formatLetterDateTime(sentAt)}
              </time>
            </div>
            <div className="mt-6">{children}</div>
          </article>
        ) : error ? (
          <RetryNotice
            screen="mailbox"
            message={error.message}
            onRetry={onRetry}
          />
        ) : isPending ? (
          <Skeleton />
        ) : null}
      </div>
    </main>
  );
};

const ReceivedBody = ({ letter }: { letter: ReceivedLetterDetail }) => {
  const blocks = readLetterBlocks(letter.contentBlocks);
  if (blocks.length > 0) return <LetterBlocks blocks={blocks} />;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[15px] leading-relaxed text-foreground">
        {letter.bodyText}
      </p>
      {/* 답장에 딸린 내 원문 — 아직 응답에 없어서, 오면 그때부터 상자가 선다 */}
      {letter.quotedFeedbackContent && (
        <QuotedLetter text={letter.quotedFeedbackContent} />
      )}
    </div>
  );
};

const SentBody = ({ feedback }: { feedback: SentFeedbackDetail }) => (
  <div className="flex flex-col gap-6">
    <p className="text-[15px] leading-relaxed text-foreground">
      {feedback.content}
    </p>
    {feedback.replies.length > 0 ? (
      feedback.replies.map((reply) => (
        <ReplySection
          key={reply.letterId}
          text={reply.bodyText}
          sentAt={reply.sentAt}
        />
      ))
    ) : (
      <WaitingNotice />
    )}
  </div>
);

const ReplySection = ({ text, sentAt }: { text: string; sentAt: string }) => (
  <div className="border-t border-border pt-6">
    <p className="text-xs font-semibold text-muted-foreground">
      랜딧 팀의 답장 · {formatLetterDateTime(sentAt)}
    </p>
    <p className="mt-2 text-[15px] leading-relaxed text-foreground">{text}</p>
  </div>
);

// 제목·칩·본문 자리를 미리 잡아 둔다 — 도착한 뒤 글이 위아래로 튀지 않게
const Skeleton = () => (
  <div className="animate-pulse">
    <div className="h-7 w-2/3 rounded-lg bg-secondary" />
    <div className="mt-3 h-[21px] w-32 rounded-full bg-secondary" />
    <div className="mt-6 h-40 rounded-2xl bg-secondary" />
  </div>
);
