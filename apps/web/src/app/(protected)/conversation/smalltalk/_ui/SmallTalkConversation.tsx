// 스몰톡 대화 화면 — 세션이 열린 뒤의 본편. 시나리오 대화와 같은 무대·카드·마이크를 쓰되,
// 오늘 남은 발화 시간을 머리 위에 두고, 끝나면 점수 대신 "얼마나 얘기했는지"를 보여준다
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
import {
  toCountdownLabel,
  toSpeakingTimeLabel,
} from '@/features/small-talk/lib/speaking-time';
import { track } from '@/shared/analytics';
import { SMALLTALK_PATH } from '@/shared/lib/routes';
import { useKeyboardInset } from '@/shared/lib/useKeyboardInset';
import { Button } from '@/shared/ui/Button';
import { ArrowRightIcon, CloseIcon } from '@/shared/ui/Icons';

import { useSmallTalkFlow } from '../_model/useSmallTalkFlow';
import { ExitDecisionSheet } from './ExitDecisionSheet';
import { SmallTalkExitSheet } from './SmallTalkExitSheet';

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
  const [showExitSheet, setShowExitSheet] = useState(false);
  // 내가 먼저 거는 대화의 진입 안내 — 랜디가 먼저 말을 걸어보라고 알려주고 잠시 후 사라진다
  const [introDismissed, setIntroDismissed] = useState(false);
  const {
    phase,
    turn,
    finishedThought,
    speech,
    input,
    leave,
    remainingMs,
    speakingRatio,
    summary,
    exitDecision,
  } = useSmallTalkFlow({
    session,
    partner,
    remainingSpeakingTimeMs,
    endSession,
  });
  const {
    transcript,
    setTranscript,
    keyboardMode,
    pressMic,
    pressKeyboard,
    cancelInput,
    finishListening,
    submitText,
    micPermissionDenied,
    dismissMicPermissionNotice,
  } = input;

  const ended = phase === 'DONE';
  // 키보드 입력 중 — 내 답변 박스가 입력창이 되고, 마이크 영역은 접어 키보드 위 공간을 확보한다
  const typing = keyboardMode && phase === 'USER_SPEAKING';
  const keyboardInset = useKeyboardInset();
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

  const goHome = () => router.replace(SMALLTALK_PATH);

  return (
    <main
      className="relative mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      // iOS WKWebView는 키보드가 떠도 레이아웃이 안 줄어든다 — 가려진 높이만큼 올려 입력 박스를 보이게 한다
      style={
        typing && keyboardInset ? { paddingBottom: keyboardInset } : undefined
      }
    >
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
        <div className="min-h-0 flex-1 overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,#000_1.25rem)] pt-5 [-webkit-mask-image:linear-gradient(to_bottom,transparent,#000_1.25rem)]">
          <QuestionCard
            question={turn.aiMessage}
            translation={turn.aiTranslation}
            speaking={phase === 'AI_SPEAKING'}
            instruction={turn.isUserOpening}
          />
        </div>
        {ended ? (
          // 점수도 총평도 없는 대화라, 남길 건 얼마나 얘기했는지뿐이다
          <div className="mt-4 flex items-center rounded-2xl bg-card px-6 py-4 shadow-sm">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">
                얘기한 시간
              </p>
              <p className="mt-1 text-lg font-extrabold text-foreground">
                {toSpeakingTimeLabel(summary.speakingDurationMs)}
              </p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="flex-1 pl-6">
              <p className="text-xs font-medium text-muted-foreground">
                주고받은 말
              </p>
              <p className="mt-1 text-lg font-extrabold text-foreground">
                {summary.exchangeCount}번
              </p>
            </div>
          </div>
        ) : (
          <UserTranscript
            text={transcript}
            phase={phase}
            editing={typing}
            onChange={setTranscript}
            onSubmit={submitText}
            onCancel={cancelInput}
          />
        )}
      </section>

      <footer className="flex-none pb-[max(env(safe-area-inset-bottom),16px)]">
        {ended ? (
          // TODO(PR4): 축하·스트릭·맞춤 표현으로 이어진다. 지금은 홈으로 돌려보낸다
          <div className="flex h-36 items-end px-5 pb-3">
            <Button onClick={goHome}>
              대화 종료하기
              <ArrowRightIcon size={16} />
            </Button>
          </div>
        ) : typing ? null : (
          <>
            {/* 남은 시간은 말하기 직전에 보여야 하는 값이라 마이크 바로 위에 둔다.
                0이 돼도 하던 말은 끊지 않고, 그 발화를 끝으로 상대가 대화를 마무리한다 */}
            <p className="mt-4 mb-1 text-center text-sm font-medium text-muted-foreground">
              남은 말하기 시간{' '}
              <span className="font-bold text-primary">
                {toCountdownLabel(remainingMs)}
              </span>
            </p>
            <MicControl
              phase={phase}
              onPress={pressMic}
              onKeyboard={pressKeyboard}
              onCancel={cancelInput}
              onDone={finishListening}
              remainingRatio={speakingRatio}
            />
          </>
        )}
      </footer>

      {/* 속마음 — 제출 대기(AI_THINKING)부터 랜디가 떠 있다가 속마음을 전한다.
          종료 확인을 묻는 동안에는 생각 중 연출을 접는다 — 답을 기다리는 건 상대가 아니라 우리다 */}
      <ThoughtOverlay
        loading={phase === 'AI_THINKING' && !exitDecision.asking}
        thought={overlayThought}
      />

      <SmallTalkExitSheet
        open={showExitSheet}
        onConfirm={() => {
          leave();
          router.replace(SMALLTALK_PATH);
        }}
        onClose={() => {
          track(EVENTS.CONFIRM_SHEET_DISMISSED, { sheet: 'conversation_exit' });
          setShowExitSheet(false);
        }}
      />

      {/* 상대가 작별 인사를 알아챘을 때 — 어느 쪽을 골라도 서버에 답을 보내야 대화가 풀린다 */}
      <ExitDecisionSheet
        open={exitDecision.asking}
        onEnd={() => exitDecision.answer('END')}
        onContinue={() => exitDecision.answer('CONTINUE')}
      />

      <MicPermissionSheet
        open={micPermissionDenied}
        onClose={dismissMicPermissionNotice}
      />
    </main>
  );
};
