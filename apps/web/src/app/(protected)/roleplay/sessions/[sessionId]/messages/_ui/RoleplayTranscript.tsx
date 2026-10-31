'use client';

// 롤플레이 대화 기록 — 스몰톡 대화 기록과 같은 말풍선·교정 카드로 그 대화를 다시 보여 준다.
// 요약을 거쳐 오므로 교정은 이미 다 만들어져 있어 기다리지 않는다. 마지막 버튼은 표현 학습이 아니라 홈이다
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { PageHeader } from '@/app/(protected)/_ui/PageHeader';
import { useRoleplaySessionQuery } from '@/features/roleplay/model/useRoleplaySessionQuery';
import {
  messageAnchorId,
  useCorrectionJump,
} from '@/features/small-talk/model/useCorrectionJump';
import {
  MyMessage,
  PartnerMessage,
} from '@/features/small-talk/ui/TranscriptMessages';
import { TranscriptSkeleton } from '@/features/small-talk/ui/TranscriptSkeleton';
import { ROLEPLAY_PATH, roleplaySummaryPath } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { ChevronDownIcon } from '@/shared/ui/Icons';

export const RoleplayTranscript = ({ sessionId }: { sessionId: number }) => {
  const router = useRouter();
  const t = useTranslations('roleplay.transcript');
  const tSmallTalk = useTranslations('smallTalk.transcript');
  const { session, error } = useRoleplaySessionQuery(sessionId);
  // 들어오면 첫 교정으로, 칩을 누르면 다음 교정으로
  const { hasNext, jumpNext } = useCorrectionJump(session?.messages ?? []);

  return (
    <main
      className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      style={{ paddingTop: 'var(--safe-area-inset-top)' }}
    >
      <PageHeader
        title={session?.title ?? ''}
        onBack={() => router.replace(roleplaySummaryPath(sessionId))}
      />

      {error ? (
        <p className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {error.message || t('loadError')}
        </p>
      ) : !session ? (
        <TranscriptSkeleton />
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pt-2 pb-8">
            {session.messages.map((message) => (
              <li
                key={message.messageId}
                id={messageAnchorId(message.messageId)}
              >
                {message.role === 'USER' ? (
                  // 교정 상태 값이 오지 않아 찾는 중·잘했어요 표시는 서지 않는다 — 고친 말이 있으면 카드만 붙는다
                  <MyMessage
                    message={message}
                    waitExpired
                    lateCorrection={false}
                  />
                ) : (
                  <PartnerMessage message={message} />
                )}
              </li>
            ))}
            {/* 칩은 목록 위에 떠 있다 — 끝까지 내려도 마지막 말풍선이 칩 밑에 깔리지 않게 칩 높이만큼 비워 둔다 */}
            {hasNext && <li aria-hidden className="h-12 shrink-0" />}
          </ul>
          {hasNext && (
            <button
              onClick={jumpNext}
              className="animate-fade-up absolute right-5 bottom-4 flex items-center gap-1 rounded-full bg-foreground px-3.5 py-2 text-13 font-semibold text-background shadow-md active:opacity-80"
            >
              {tSmallTalk('nextCorrectionButton')}
              <ChevronDownIcon size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}

      <footer className="flex-none px-5 pt-3 pb-[max(var(--safe-area-inset-bottom),16px)]">
        <Button onClick={() => router.replace(ROLEPLAY_PATH)}>
          {t('homeButton')}
        </Button>
      </footer>
    </main>
  );
};
