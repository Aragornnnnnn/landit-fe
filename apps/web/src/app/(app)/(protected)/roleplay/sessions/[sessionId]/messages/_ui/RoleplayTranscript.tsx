'use client';

// 롤플레이 대화 기록 — 스몰톡 대화 기록과 같은 말풍선·교정 카드로 그 대화를 다시 보여 준다.
// 요약이나 지난 대화 목록에서 온다. 교정을 아직 만드는 중이면 찾는 중으로 보여 준다. 마지막 버튼은 표현 학습이 아니라 홈이다
import { useEffect, useEffectEvent, useRef } from 'react';
import { EVENTS } from '@landit/analytics';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { PageHeader } from '@/app/(app)/(protected)/_ui/PageHeader';
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
import { track } from '@/shared/analytics';
import {
  backOrReplace,
  ROLEPLAY_PATH,
  roleplaySessionsPath,
  roleplaySummaryPath,
} from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { ChevronDownIcon } from '@/shared/ui/Icons';

import { toTranscriptMessage } from '../_model/transcript-message';

export const RoleplayTranscript = ({
  sessionId,
  fromRoleplayId,
}: {
  sessionId: number;
  // 지난 대화 목록에서 왔으면 그 시나리오
  fromRoleplayId?: number;
}) => {
  const router = useRouter();
  const t = useTranslations('roleplay.transcript');
  const tSmallTalk = useTranslations('smallTalk.transcript');
  const { session, error, waitExpired } = useRoleplaySessionQuery(sessionId);
  const messages = (session?.messages ?? []).map((message) =>
    toTranscriptMessage(message, ({ month, day, label }) =>
      t('memoryTagLabel', {
        month,
        day,
        label: label ?? t('memoryDefaultLabel'),
      }),
    ),
  );
  // 들어오면 첫 교정으로, 칩을 누르면 다음 교정으로
  const { hasNext, jumpNext } = useCorrectionJump(messages);

  // 대화가 실제로 그려진 순간을 노출로 기록한다 — 어느 길로 왔고 고친 말이 몇 개인지가 실린다.
  // 이벤트로 감싸 폴링으로 응답이 갱신돼도 다시 찍지 않는다. 만드는 중인 교정은 세지 않는다
  const shown = session !== null;
  const trackViewed = useEffectEvent(() => {
    if (!session) return;
    track(EVENTS.ROLEPLAY_FEEDBACK_VIEWED, {
      session_id: sessionId,
      source: fromRoleplayId === undefined ? 'summary' : 'history',
      correction_count: session.messages.filter(
        (message) => message.correction?.sentence,
      ).length,
    });
  });
  const viewedRef = useRef(false);
  useEffect(() => {
    if (!shown || viewedRef.current) return; // StrictMode에도 노출은 한 번이다
    viewedRef.current = true;
    trackViewed();
  }, [shown, sessionId]);

  return (
    <main
      className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      style={{ paddingTop: 'var(--safe-area-inset-top)' }}
    >
      <PageHeader
        title={session?.title ?? ''}
        onBack={() =>
          fromRoleplayId === undefined
            ? router.replace(roleplaySummaryPath(sessionId))
            : backOrReplace(router, roleplaySessionsPath(fromRoleplayId))
        }
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
            {messages.map((message) => (
              <li
                key={message.messageId}
                id={messageAnchorId(message.messageId)}
              >
                {message.role === 'USER' ? (
                  <MyMessage
                    message={message}
                    waitExpired={waitExpired}
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
