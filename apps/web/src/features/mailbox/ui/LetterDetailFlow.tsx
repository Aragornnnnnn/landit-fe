'use client';

// 편지 한 통을 펼쳐 보는 화면 — 종류에 따라 본문 모양이 갈린다
import { useRouter } from 'next/navigation';

import { useScrollShadow } from '@/shared/lib/useScrollShadow';
import { BackHeader } from '@/shared/ui/BackHeader';
import { RetryNotice } from '@/shared/ui/RetryNotice';

import type { LetterDetail } from '../api/letter-detail';
import { formatLetterDateTime } from '../lib/letter-date';
import { mailboxPath } from '../model/box';
import { toLetterHead } from '../model/letter-detail-head';
import { useLetterDetailQuery } from '../model/useLetterDetailQuery';
import { useMarkLetterRead } from '../model/useMarkLetterRead';
import { LetterBlocks } from './detail/LetterBlocks';
import { QuotedLetter } from './detail/QuotedLetter';
import { WaitingNotice } from './detail/WaitingNotice';
import { LetterBadge } from './LetterBadge';

export const LetterDetailFlow = ({ letterId }: { letterId: number }) => {
  const router = useRouter();
  const { ref: scrollRef, onScroll, hasShadow } = useScrollShadow();
  const { letter, isPending, error, retry } = useLetterDetailQuery(letterId);
  useMarkLetterRead(letter);

  // 편지가 있던 칸으로 돌려보낸다. 되짚기(back)로 두면 알림 딥링크처럼 히스토리가
  // 없는 진입에서 화살표가 아무 일도 하지 않는 막다른 화면이 된다
  const backToBox = () =>
    router.replace(
      mailboxPath(letter?.kind === 'FEEDBACK' ? 'sent' : 'received'),
    );

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <BackHeader hasShadow={hasShadow} onBack={backToBox} />

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-5 pb-10"
      >
        <LetterView
          letter={letter}
          error={error}
          isPending={isPending}
          onRetry={retry}
        />
      </div>
    </main>
  );
};

// 편지가 있으면 편지가 이긴다 — 다시 불러오다 실패해도 보고 있던 편지는 그대로 둔다
const LetterView = ({
  letter,
  error,
  isPending,
  onRetry,
}: {
  letter: LetterDetail | null;
  error: Error | null;
  isPending: boolean;
  onRetry: () => void;
}) => {
  if (letter) return <LetterBody letter={letter} />;
  if (error) {
    return (
      <RetryNotice screen="mailbox" message={error.message} onRetry={onRetry} />
    );
  }
  return isPending ? <Skeleton /> : null;
};

const LetterBody = ({ letter }: { letter: LetterDetail }) => {
  const { title, badge } = toLetterHead(letter);

  return (
    <article>
      <h1 className="text-xl leading-snug font-bold text-foreground">
        {title}
      </h1>
      <div className="mt-3 flex items-center gap-2">
        <LetterBadge label={badge.label} tone={badge.tone} />
        <time className="text-[13px] text-muted-foreground">
          {formatLetterDateTime(letter.sentAt)}
        </time>
      </div>

      <div className="mt-6">
        <LetterContent letter={letter} />
      </div>
    </article>
  );
};

// 종류마다 읽는 순서가 다르다 — 답장은 답장이 먼저고 내 원문이 뒤,
// 보낸 편지는 내가 쓴 글이 먼저고 그에 대한 응답이 뒤다
const LetterContent = ({ letter }: { letter: LetterDetail }) => {
  if (letter.kind === 'NOTICE' || letter.kind === 'UPDATE') {
    return <LetterBlocks blocks={letter.blocks} />;
  }

  if (letter.kind === 'REPLY') {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-[15px] leading-relaxed text-foreground">
          {letter.replyText}
        </p>
        <QuotedLetter text={letter.quotedText} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[15px] leading-relaxed text-foreground">
        {letter.content}
      </p>
      {letter.reply ? (
        <ReplySection text={letter.reply.text} sentAt={letter.reply.sentAt} />
      ) : (
        <WaitingNotice />
      )}
    </div>
  );
};

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
