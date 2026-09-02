'use client';

// 편지 한 통을 펼쳐 보는 화면 — 받은 편지와 보낸 피드백이 리소스가 달라 화면도 둘로 갈린다.
// 겉모습(헤더·제목·칩·시각)은 같아서 그 골격만 여기서 공유하고, 본문은 ui/detail이 그린다
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// LAN-428 설문(임시) — features 간 가로 import. 설문이 끝나면 이 두 import와 아래 CTA 한 줄을 지운다
import { isSurveyLetter } from '@/features/survey/model/survey-letter';
import { SurveyLetterCta } from '@/features/survey/ui/SurveyLetterCta';
import { useScrollShadow } from '@/shared/lib/useScrollShadow';
import { BackHeader } from '@/shared/ui/BackHeader';
import { RetryNotice } from '@/shared/ui/RetryNotice';

import { formatLetterDateTime } from '../lib/letter-date';
import { mailboxPath } from '../model/box';
import {
  toReceivedHead,
  toSentHead,
  type LetterHead,
} from '../model/letter-detail-head';
import {
  useReceivedLetterQuery,
  useSentFeedbackQuery,
} from '../model/useLetterDetailQuery';
import { ReceivedBody } from './detail/ReceivedBody';
import { SentBody } from './detail/SentBody';
import { LetterBadge } from './LetterBadge';

export const ReceivedLetterFlow = ({ letterId }: { letterId: number }) => {
  const { letter, isPending, error, retry } = useReceivedLetterQuery(letterId);

  return (
    <LetterShell
      fallbackHref={mailboxPath('received')}
      head={letter && toReceivedHead(letter)}
      isPending={isPending}
      error={error}
      onRetry={retry}
    >
      {letter && <ReceivedBody letter={letter} />}
      {letter && isSurveyLetter(letter.letterId) && <SurveyLetterCta />}
    </LetterShell>
  );
};

export const SentFeedbackFlow = ({ feedbackId }: { feedbackId: number }) => {
  const { letter, isPending, error, retry } = useSentFeedbackQuery(feedbackId);

  return (
    <LetterShell
      fallbackHref={mailboxPath('sent')}
      head={letter && toSentHead(letter)}
      isPending={isPending}
      error={error}
      onRetry={retry}
    >
      {letter && <SentBody feedback={letter} />}
    </LetterShell>
  );
};

interface LetterShellProps {
  // 주소로 바로 열어 되돌아갈 곳이 없을 때 보낼 곳
  fallbackHref: string;
  head: LetterHead | null;
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  children: ReactNode;
}

const LetterShell = ({ fallbackHref, ...content }: LetterShellProps) => {
  const router = useRouter();
  const { ref: scrollRef, onScroll, hasShadow } = useScrollShadow();

  // 목록에서 열고 들어왔으면 되돌아간다 — replace로 두면 편지 칸이 목록으로 바뀌어 목록이 히스토리에 두 겹 남고,
  // 그 뒤 휴대폰 뒤로가기가 한 번 헛눌린다. 주소로 바로 열었으면(딥링크·새로고침) 되돌아갈 데가 없으니 fallback으로
  const back = () =>
    window.history.length > 1 ? router.back() : router.replace(fallbackHref);

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <BackHeader hasShadow={hasShadow} onBack={back} />

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-5 pb-10"
      >
        <LetterContent {...content} />
      </div>
    </main>
  );
};

// 편지가 있으면 편지가 이긴다 — 다시 불러오다 실패해도 보고 있던 편지는 그대로 둔다
const LetterContent = ({
  head,
  isPending,
  error,
  onRetry,
  children,
}: Omit<LetterShellProps, 'fallbackHref'>) => {
  if (head) {
    return (
      <article>
        <h1 className="text-xl leading-snug font-bold text-foreground">
          {head.title}
        </h1>
        <div className="mt-3 flex items-center gap-2">
          <LetterBadge label={head.badge.label} tone={head.badge.tone} />
          <time className="text-[13px] text-muted-foreground">
            {formatLetterDateTime(head.sentAt)}
          </time>
        </div>
        <div className="mt-6">{children}</div>
      </article>
    );
  }
  if (error) {
    return (
      <RetryNotice screen="mailbox" message={error.message} onRetry={onRetry} />
    );
  }
  return isPending ? <Skeleton /> : null;
};

// 제목·칩·본문 자리를 미리 잡아 둔다 — 도착한 뒤 글이 위아래로 튀지 않게
const Skeleton = () => (
  <div className="animate-pulse">
    <div className="h-7 w-2/3 rounded-lg bg-secondary" />
    <div className="mt-3 h-[21px] w-32 rounded-full bg-secondary" />
    <div className="mt-6 h-40 rounded-2xl bg-secondary" />
  </div>
);
