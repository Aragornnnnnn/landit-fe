'use client';

// 그날 주고받은 말 — 대화였으니 대화처럼 보여야 그때가 떠오른다.
// 대화 화면의 말풍선은 TTS·마이크가 얽혀 있어 여기서는 읽기 전용으로 새로 그린다.
// 대화 중엔 교정을 보여주지 않는 대신, 여기서 내 말풍선 아래에 더 자연스러운 말과 배운 표현 재사용을 붙인다
import { useEffect, useEffectEvent, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { PageHeader } from '@/app/(protected)/_ui/PageHeader';
import { toSessionTitle } from '@/features/small-talk/lib/session-summary';
import {
  messageAnchorId,
  useCorrectionJump,
} from '@/features/small-talk/model/useCorrectionJump';
import { useSmallTalkSessionQuery } from '@/features/small-talk/model/useSmallTalkSessionQuery';
import {
  MyMessage,
  PartnerMessage,
} from '@/features/small-talk/ui/TranscriptMessages';
import { TranscriptSkeleton } from '@/features/small-talk/ui/TranscriptSkeleton';
import { track } from '@/shared/analytics';
import {
  sessionExpressionBranchPath,
  smallTalkHistoryPath,
} from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { ArrowRightIcon, ChevronDownIcon } from '@/shared/ui/Icons';

import { waitedCorrectionIds } from '../_model/late-corrections';

interface SmallTalkTranscriptProps {
  sessionId: number;
  // 대화 종료 흐름(오늘의 스몰톡 → 상세 피드백)에서 왔는가 — 그러면 다음은 표현 학습이라 하단에 그 버튼이 선다.
  // 기록에서 열었으면 버튼 없이 뒤로가기뿐이다
  continueToLearning: boolean;
}

// 아직 아무것도 안 기다린 상태 — 렌더마다 새 집합을 만들지 않게 하나를 돌려 쓴다
const EMPTY_WAITED: ReadonlySet<number> = new Set();

export const SmallTalkTranscript = ({
  sessionId,
  continueToLearning,
}: SmallTalkTranscriptProps) => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('smallTalk');
  // 교정은 대화가 끝난 뒤 따로 만들어진다 — 이 화면이 그걸 그리므로 준비될 때까지 기다린다
  const { session, error, isLoading, waitExpired } = useSmallTalkSessionQuery(
    sessionId,
    { awaitCorrections: true },
  );
  // 들어오면 첫 교정으로, 칩을 누르면 다음 교정으로
  const { hasNext, jumpNext } = useCorrectionJump(session?.messages ?? []);

  // 폴링으로 뒤늦게 온 교정만 떠오르게 한다 — 들어올 때 이미 있던 카드는 그냥 그린다
  const [waited, setWaited] = useState<ReadonlySet<number>>(EMPTY_WAITED);
  const seenWaited = waitedCorrectionIds(waited, session?.messages ?? []);
  if (seenWaited !== waited) setWaited(seenWaited);

  // 대화가 실제로 그려진 순간을 노출로 기록한다 — 어느 길로 왔고 볼 교정이 몇 개인지가 실린다.
  // 이벤트로 감싸 폴링으로 응답이 갱신돼도 다시 찍지 않는다
  const shown = session !== null;
  const trackViewed = useEffectEvent(() => {
    if (!session) return;
    track(EVENTS.SMALL_TALK_FEEDBACK_VIEWED, {
      session_id: sessionId,
      source: continueToLearning ? 'summary' : 'history',
      correction_count: session.correctionCount,
    });
  });
  useEffect(() => {
    if (shown) trackViewed();
  }, [shown, sessionId]);

  return (
    <main
      className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      style={{ paddingTop: 'var(--safe-area-inset-top)' }}
    >
      <PageHeader
        title={
          session
            ? toSessionTitle(session.title, session.completedAt, t, locale)
            : ''
        }
        onBack={() => router.replace(smallTalkHistoryPath(sessionId))}
      />

      {error ? (
        <p className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {error.message || t('transcript.loadError')}
        </p>
      ) : isLoading ? (
        <TranscriptSkeleton />
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col">
          {/* 아래 버튼은 대화를 마친 직후에만 있다 — 기록에서 들어오면 목록이 바닥에 닿아 내비게이션 바 위로 띄운다 */}
          <ul
            className={`flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pt-2 ${continueToLearning ? 'pb-8' : 'pb-[max(var(--safe-area-inset-bottom),32px)]'}`}
          >
            {session?.messages.map((message) => (
              <li
                key={message.messageId}
                id={messageAnchorId(message.messageId)}
              >
                {message.role === 'USER' ? (
                  <MyMessage
                    message={message}
                    waitExpired={waitExpired}
                    lateCorrection={seenWaited.has(message.messageId)}
                  />
                ) : (
                  <PartnerMessage message={message} />
                )}
              </li>
            ))}
            {/* 칩은 목록 위에 떠 있다 — 끝까지 내려도 마지막 말풍선이 칩 밑에 깔리지 않게 칩 높이만큼 비워 둔다 */}
            {hasNext && (
              <li
                aria-hidden
                data-testid="next-correction-chip-space"
                className="h-12 shrink-0"
              />
            )}
          </ul>
          {/* 진행바 대신 칩 하나 — 아직 안 본 교정이 남았을 때만 떠서 다음 카드로 데려간다 */}
          {hasNext && (
            <button
              onClick={jumpNext}
              className={`animate-fade-up absolute right-5 ${continueToLearning ? 'bottom-4' : 'bottom-[max(var(--safe-area-inset-bottom),16px)]'} flex items-center gap-1 rounded-full bg-foreground px-3.5 py-2 text-13 font-semibold text-background shadow-md active:opacity-80`}
            >
              {t('transcript.nextCorrectionButton')}
              <ChevronDownIcon size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}

      {continueToLearning && (
        // 요약 → 대화 보기를 거친 뒤의 마지막 단계 — 축하·표현 생성으로
        <footer className="flex-none px-5 pt-3 pb-[max(var(--safe-area-inset-bottom),16px)]">
          <Button
            onClick={() =>
              router.replace(
                sessionExpressionBranchPath(sessionId, { celebrate: true }),
              )
            }
          >
            {t('transcript.learnButton')}
            <ArrowRightIcon size={16} />
          </Button>
        </footer>
      )}
    </main>
  );
};
