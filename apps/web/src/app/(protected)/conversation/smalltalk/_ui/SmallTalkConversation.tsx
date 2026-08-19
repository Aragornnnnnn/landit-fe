// 스몰톡 대화 화면 — 세션이 열린 뒤의 본편. 시나리오 대화와 같은 무대·카드·마이크를 쓰되,
// 오늘 남은 발화 시간을 머리 위에 두고, 끝나면 점수 대신 "얼마나 얘기했는지"를 보여준다.
// 답은 말로만 한다 — 타이핑은 발화 시간을 안 쓰므로 하루 1분이라는 규칙이 무의미해진다
'use client';

import { useEffect, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import {
  toCharacterLook,
  type Partner,
} from '@/features/conversation/model/character-look';
import { userIntroHoldMs } from '@/features/conversation/model/pacing';
import type { FloatingThought } from '@/features/conversation/model/thought';
import { CharacterStage } from '@/features/conversation/ui/flow/CharacterStage';
import { MicControl } from '@/features/conversation/ui/flow/MicControl';
import { MicPermissionSheet } from '@/features/conversation/ui/flow/MicPermissionSheet';
import { QuestionCard } from '@/features/conversation/ui/flow/QuestionCard';
import { ThoughtOverlay } from '@/features/conversation/ui/flow/ThoughtOverlay';
import { UserTranscript } from '@/features/conversation/ui/flow/UserTranscript';
import type { SmallTalkSessionStartResponse } from '@/features/small-talk/api/small-talk';
import { toCountdownLabel } from '@/features/small-talk/lib/speaking-time';
import { track } from '@/shared/analytics';
import {
  sessionExpressionBranchPath,
  SMALLTALK_PATH,
} from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { ArrowRightIcon, CloseIcon } from '@/shared/ui/Icons';

import { useSmallTalkFlow } from '../_model/useSmallTalkFlow';
import { SmallTalkExitSheet } from './SmallTalkExitSheet';
import { TalkSummary } from './TalkSummary';

interface SmallTalkConversationProps {
  session: SmallTalkSessionStartResponse;
  partner: Partner;
  remainingSpeakingTimeMs: number;
  endSession: () => void;
}

export const SmallTalkConversation = ({
  session,
  partner,
  remainingSpeakingTimeMs,
  endSession,
}: SmallTalkConversationProps) => {
  const router = useRouter();
  const goHome = () => router.replace(SMALLTALK_PATH);
  const [showExitSheet, setShowExitSheet] = useState(false);
  // 내가 먼저 거는 대화의 진입 안내 — 랜디가 먼저 말을 걸어보라고 알려주고 잠시 후 사라진다
  const [introDismissed, setIntroDismissed] = useState(false);
  const {
    phase,
    turnIndex,
    turn,
    finishedThought,
    speech,
    input,
    leave,
    remainingMs,
    speakingRatio,
    summary,
  } = useSmallTalkFlow({
    session,
    partner,
    remainingSpeakingTimeMs,
    endSession,
    goHome,
  });
  const {
    transcript,
    pressMic,
    cancelInput,
    finishListening,
    micPermissionDenied,
    dismissMicPermissionNotice,
  } = input;

  const ended = phase === 'DONE';
  const showUserFirstIntro =
    turn.isUserOpening && phase === 'USER_READY' && !introDismissed;
  useEffect(() => {
    if (!showUserFirstIntro) return;
    const timer = setTimeout(() => setIntroDismissed(true), userIntroHoldMs);
    return () => clearTimeout(timer);
  }, [showUserFirstIntro]);

  const resolveOverlayThought = (): FloatingThought | null => {
    if (showUserFirstIntro)
      return { text: '편하게 인사부터 건네 보세요!', type: 'NORMAL' };
    if (phase === 'AI_INNER_THOUGHT')
      return { text: turn.innerThought, type: turn.innerThoughtType };
    return null;
  };
  const overlayThought = resolveOverlayThought();
  const characterLook = toCharacterLook(phase, finishedThought);

  return (
    <main className="relative mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <header
        className="absolute inset-x-0 top-0 z-20 flex items-center px-3"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}
      >
        <button
          onClick={() => {
            track(EVENTS.CONFIRM_SHEET_OPENED, { sheet: 'conversation_exit' });
            setShowExitSheet(true);
          }}
          className="flex size-10 items-center justify-center text-foreground transition-transform active:scale-90"
          aria-label="대화 나가기"
        >
          <CloseIcon size={24} />
        </button>
      </header>

      <CharacterStage partner={partner} look={characterLook} speech={speech} />

      <section className="flex min-h-0 flex-1 flex-col px-5">
        {/* 카드가 남는 높이를 다 쓰되 넘치진 않는다 — 넘치는 글은 카드 안에서 스크롤된다 */}
        <div className="flex min-h-0 flex-1 flex-col pt-2">
          <QuestionCard
            question={turn.aiMessage}
            translation={turn.aiTranslation}
            speaking={phase === 'AI_SPEAKING'}
            instruction={turn.isUserOpening}
            onTranslationToggled={(opened) =>
              track(EVENTS.TRANSLATION_TOGGLED, {
                session_id: session.sessionId,
                turn_index: turnIndex,
                opened,
              })
            }
          />
        </div>
        {ended ? (
          <TalkSummary {...summary} />
        ) : (
          <UserTranscript text={transcript} phase={phase} />
        )}
      </section>

      <footer className="flex-none pb-[max(env(safe-area-inset-bottom),16px)]">
        {ended ? (
          // 축하 → 맞춤 표현으로 이어진다. 표현은 서버가 지금 만들고 있어 그 화면이 기다린다
          <div className="flex h-36 items-end px-5 pb-3">
            <Button
              onClick={() =>
                router.replace(
                  sessionExpressionBranchPath(session.sessionId, {
                    celebrate: true,
                  }),
                )
              }
            >
              대화 종료하기
              <ArrowRightIcon size={16} />
            </Button>
          </div>
        ) : (
          <>
            {/* 남은 시간은 말하기 직전에 보여야 하는 값이라 마이크 바로 위에 둔다.
                0이 돼도 하던 말은 끊지 않고, 그 발화를 끝으로 상대가 대화를 마무리한다 */}
            <p className="mt-1 text-center text-sm font-medium text-muted-foreground">
              남은 말하기 시간{' '}
              <span className="font-bold text-primary">
                {toCountdownLabel(remainingMs)}
              </span>
            </p>
            <MicControl
              phase={phase}
              onPress={pressMic}
              onCancel={cancelInput}
              onDone={finishListening}
              remainingRatio={speakingRatio}
            />
          </>
        )}
      </footer>

      {/* 속마음 — 제출 대기(AI_THINKING)부터 랜디가 떠 있다가 속마음을 전한다 */}
      <ThoughtOverlay
        loading={phase === 'AI_THINKING'}
        thought={overlayThought}
      />

      <SmallTalkExitSheet
        open={showExitSheet}
        onConfirm={() => {
          leave();
          goHome();
        }}
        onClose={() => {
          track(EVENTS.CONFIRM_SHEET_DISMISSED, { sheet: 'conversation_exit' });
          setShowExitSheet(false);
        }}
      />

      <MicPermissionSheet
        open={micPermissionDenied}
        onClose={dismissMicPermissionNotice}
      />
    </main>
  );
};
