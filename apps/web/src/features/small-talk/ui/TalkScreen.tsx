// 발화 시간을 쓰는 대화의 본편 화면 — 스몰톡과 롤플레이가 같이 쓴다. 시나리오 대화와 같은 무대·카드·마이크를 쓰되,
// 오늘 남은 발화 시간을 마이크 위에 두고, 끝나면 점수 대신 "얼마나 얘기했는지"를 보여준다.
// 답은 말로도 타이핑으로도 한다 — 타이핑 동안엔 발화 시간이 흐르지 않는다.
// 대화마다 다른 것(흐름 훅·종료 시트·내가 먼저 걸 때의 안내)은 화면을 쓰는 쪽이 넣는다
'use client';

import { useEffect, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import {
  toCharacterLook,
  type Partner,
} from '@/features/conversation/model/character-look';
import { userIntroHoldMs } from '@/features/conversation/model/pacing';
import type { FloatingThought } from '@/features/conversation/model/thought';
import type { useConversationTurns } from '@/features/conversation/model/useConversationTurns';
import { useTalkDisplay } from '@/features/conversation/model/useTalkDisplay';
import { CharacterStage } from '@/features/conversation/ui/flow/CharacterStage';
import { MicControl } from '@/features/conversation/ui/flow/MicControl';
import { MicPermissionSheet } from '@/features/conversation/ui/flow/MicPermissionSheet';
import { QuestionCard } from '@/features/conversation/ui/flow/QuestionCard';
import { ThoughtOverlay } from '@/features/conversation/ui/flow/ThoughtOverlay';
import { UserTranscript } from '@/features/conversation/ui/flow/UserTranscript';
import { track } from '@/shared/analytics';
import { useDocumentScrollPin } from '@/shared/lib/useDocumentScrollPin';
import { useKeyboardInset } from '@/shared/lib/useKeyboardInset';
import { Button } from '@/shared/ui/Button';
import { ArrowRightIcon, CloseIcon } from '@/shared/ui/Icons';

import { toCountdownLabel } from '../lib/speaking-time';
import { useSpeakingLimit } from '../model/useSpeakingLimit';
import { TalkSummary } from './TalkSummary';

// 흐름 훅이 화면에 내주는 것 — 대화 엔진 상태에 발화 예산·종료 처리를 더한 모양이다
export type TalkScreenFlow = Pick<
  ReturnType<typeof useConversationTurns>,
  | 'phase'
  | 'turnIndex'
  | 'turn'
  | 'finishedThought'
  | 'speech'
  | 'replay'
  | 'input'
  | 'resend'
> & {
  // X를 눌렀다 — 종료 시트로 물어봐야 하면 true, 흐름 훅이 알아서 보냈으면 false
  pressClose: () => boolean;
  remainingMs: number;
  // 이번 발화에서 남은 몫(0~1) — 마이크 둘레의 타이머 링이 그린다
  speakingRatio: number;
  // 끝난 뒤 보여 줄 이 대화의 기록
  summary: { speakingDurationMs: number; exchangeCount: number };
};

interface TalkScreenProps {
  sessionId: number;
  partner: Partner;
  flow: TalkScreenFlow;
  // 대화가 끝난 뒤 갈 다음 화면 — 끝나자마자 라우트를 미리 받아 둔다
  summaryPath: string;
  onShowSummary: () => void;
  // X로 종료 시트를 열어야 할 때 — 시트는 화면을 쓰는 쪽이 children으로 넣는다
  onExitRequested: () => void;
  // 내가 먼저 거는 대화의 진입 안내 — 랜디가 먼저 말을 걸어보라고 알려주고 잠시 후 사라진다
  userFirstHint?: string;
  children?: React.ReactNode;
}

export const TalkScreen = ({
  sessionId,
  partner,
  flow,
  summaryPath,
  onShowSummary,
  onExitRequested,
  userFirstHint,
  children,
}: TalkScreenProps) => {
  const t = useTranslations('conversation.smallTalkConversation');
  const router = useRouter();
  const display = useTalkDisplay();
  // 결제가 열리면 하루 한도가 없다 — 남은 시간과 타이머 링을 그리지 않는다 (잔량 계산은 뒤에서 그대로 돈다)
  const { unlimited } = useSpeakingLimit();
  const [introDismissed, setIntroDismissed] = useState(false);
  const {
    phase,
    turnIndex,
    turn,
    finishedThought,
    speech,
    replay,
    input,
    resend,
    pressClose,
    remainingMs,
    speakingRatio,
    summary,
  } = flow;
  const {
    transcript,
    speechPending,
    pressMic,
    pressKeyboard,
    cancelInput,
    finishListening,
    keyboardMode,
    setTranscript,
    submitText,
    reviewing,
    speakAgain,
    editTranscript,
    submitReviewed,
    closeTyping,
    micPermissionDenied,
    dismissMicPermissionNotice,
  } = input;

  const ended = phase === 'DONE';
  // 타이핑 중(키보드로 쓰거나 말한 뒤 고치는 중) — 내 답변 박스가 입력창이 되고, 마이크 영역은 접어 키보드 위 공간을 확보한다
  const typing = keyboardMode && phase === 'USER_SPEAKING';
  const keyboardInset = useKeyboardInset();
  // 키보드가 입력 박스를 밀어 올린 상태 — 하단 inset 영역은 키보드가 덮는다
  const keyboardLifted = typing && keyboardInset > 0;
  // 입력하는 동안 iOS가 문서를 밀어 화면이 두 번 올라가지 않게 맨 위에 붙잡는다
  useDocumentScrollPin(typing);
  // 대화가 끝나면 다음 화면 라우트를 미리 받아 둔다 — CTA가 버튼이라 링크 자동 프리페치가 안 걸리고,
  // 누르는 순간 받으면 늦다 (요약 데이터·그림은 흐름 훅이 완료 턴에서 미리 받는다)
  useEffect(() => {
    if (ended) router.prefetch(summaryPath);
  }, [ended, router, summaryPath]);
  const showUserFirstIntro =
    userFirstHint !== undefined &&
    turn.isUserOpening &&
    phase === 'USER_READY' &&
    !introDismissed;
  useEffect(() => {
    if (!showUserFirstIntro) return;
    const timer = setTimeout(() => setIntroDismissed(true), userIntroHoldMs);
    return () => clearTimeout(timer);
  }, [showUserFirstIntro]);

  const resolveOverlayThought = (): FloatingThought | null => {
    if (showUserFirstIntro) return { text: userFirstHint, type: 'NORMAL' };
    if (phase === 'AI_INNER_THOUGHT')
      return { text: turn.innerThought, type: turn.innerThoughtType };
    return null;
  };
  const overlayThought = resolveOverlayThought();
  const characterLook = toCharacterLook(phase, finishedThought);

  return (
    <main
      className="relative mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      // iOS WKWebView는 키보드가 떠도 레이아웃이 안 줄어든다 — 가려진 높이만큼 올려 입력 박스를 보이게 한다
      style={keyboardLifted ? { paddingBottom: keyboardInset } : undefined}
    >
      <header
        className="absolute inset-x-0 top-0 z-20 flex items-center px-3"
        style={{ paddingTop: 'max(var(--safe-area-inset-top), 8px)' }}
      >
        <button
          onClick={() => {
            // 끝난 대화·나눈 대화 없음은 흐름 훅이 알아서 보낸다 — 물어볼 때만 시트를 연다
            if (!pressClose()) return;
            track(EVENTS.CONFIRM_SHEET_OPENED, { sheet: 'conversation_exit' });
            // 동적 페이지라 받는 건 라우트 뼈대뿐이지만, 완료 응답을 기다리는 동안 먼저 받아 둔다
            router.prefetch(summaryPath);
            onExitRequested();
          }}
          className="flex size-10 items-center justify-center text-foreground transition-transform active:scale-90"
          aria-label={t('exitButton')}
        >
          <CloseIcon size={24} />
        </button>
      </header>

      <CharacterStage partner={partner} look={characterLook} speech={speech} />

      {/* 질문과 답변 칸이 무대 아래 높이를 나눠 쓴다 — 둘 다 글 길이만큼 서고, 모자라면 질문이 최소 높이까지 먼저 줄어(줄어드는 비율 1000) 안에서 스크롤된다. 지금 읽고 고칠 건 내 답이다.
          키보드가 없을 땐 무대 높이를 건드리지 않고, 키보드가 올라오면 무대가 먼저 줄어 입력창에 자리를 내준다 */}
      <div
        className={`flex min-h-0 flex-col ${keyboardLifted ? 'flex-initial' : 'flex-1'}`}
      >
        {/* 질문은 글자 크기와 상관없이 한 줄은 온전히 보이게 남긴다(카드 여백·버튼 4.75rem + 17px 글 한 줄). 더 크게 잡으면 짧은 질문 밑이 빈다.
          키보드가 올라와 있는 동안엔 질문을 접는다 — 입력창이 캐릭터 바로 아래에 붙고, 남는 높이는 입력창과 키보드 사이로 간다 */}
        <section
          className={
            keyboardLifted
              ? 'hidden'
              : 'flex min-h-[calc(4.75rem+1.46rem*var(--font-scale))] flex-auto shrink-[1000] flex-col px-5'
          }
        >
          {/* 카드가 남는 높이를 다 쓰되 넘치진 않는다 — 넘치는 글은 카드 안에서 스크롤된다.
            끝난 뒤엔 남는 높이를 통계 시트 아래로 넘긴다 — 시트가 작별 인사에 붙어야 이 대화의 결과로 읽힌다 */}
          <div
            className={`flex min-h-0 flex-col pt-2 ${ended ? '' : 'flex-1'}`}
          >
            <QuestionCard
              question={turn.aiMessage}
              translation={turn.aiTranslation}
              speaking={phase === 'AI_SPEAKING'}
              instruction={turn.isUserOpening}
              onTranslationToggled={(opened) =>
                track(EVENTS.TRANSLATION_TOGGLED, {
                  session_id: sessionId,
                  turn_index: turnIndex,
                  opened,
                })
              }
              replay={replay}
              textHidden={display.textHidden}
              onTextToggled={(visible) =>
                track(EVENTS.ENGLISH_TEXT_TOGGLED, {
                  session_id: sessionId,
                  turn_index: turnIndex,
                  hidden: !visible,
                })
              }
              translationDefaultOpen={display.translationDefaultOpen}
            />
          </div>
          {ended && (
            <>
              <TalkSummary {...summary} />
              <div className="flex-1" />
            </>
          )}
        </section>

        {/* 답변 칸은 질문 영역 밖에 둔다 — 키보드가 올라와 자리가 모자라면 질문이 아니라 무대가 줄고, 입력창은 그대로 키보드 위에 선다 */}
        {!ended && (
          <div className="flex min-h-0 shrink flex-col px-5">
            <UserTranscript
              text={transcript}
              speechPending={speechPending}
              phase={phase}
              unsent={resend != null}
              editing={typing}
              onChange={setTranscript}
              onSubmit={submitText}
              onCancel={closeTyping}
              onEdit={reviewing && !typing ? editTranscript : undefined}
            />
          </div>
        )}
      </div>

      <footer
        className={`flex-none ${keyboardLifted ? 'pb-4' : 'pb-[max(var(--safe-area-inset-bottom),16px)]'}`}
      >
        {ended ? (
          // 버튼은 끝내는 말이 아니라 다음에 볼 것으로 부른다 — 여기서 대화는 이미 끝났다
          <div className="flex h-36 items-end px-5 pb-3">
            <Button onClick={onShowSummary}>
              {t('feedbackButton')}
              <ArrowRightIcon size={16} />
            </Button>
          </div>
        ) : typing ? null : (
          <>
            {/* 남은 시간은 말하기 직전에 보여야 하는 값이라 마이크 바로 위에 둔다.
                0이 돼도 하던 말은 끊지 않고, 그 발화를 끝으로 상대가 대화를 마무리한다.
                무제한이면 이 줄째 없다 — "무제한"이라 써 둘 것도 없다 */}
            {!unlimited && (
              <p className="mt-3 text-center text-sm font-medium text-muted-foreground">
                {/* 남은 시간만 강조색으로 — 언어마다 앞뒤 말 순서가 달라 문구 안에 자리를 둔다 */}
                {t.rich('remainingTimeLabel', {
                  time: toCountdownLabel(remainingMs),
                  emphasis: (chunks) => (
                    <span className="font-bold text-primary">{chunks}</span>
                  ),
                })}
              </p>
            )}
            <MicControl
              phase={phase}
              onPress={pressMic}
              onKeyboard={pressKeyboard}
              onCancel={cancelInput}
              onDone={finishListening}
              remainingRatio={unlimited ? undefined : speakingRatio}
              onResend={resend}
              review={
                reviewing
                  ? { onRetry: speakAgain, onSend: submitReviewed }
                  : undefined
              }
            />
          </>
        )}
      </footer>

      {/* 속마음 — 제출 대기(AI_THINKING)부터 랜디가 떠 있다가 속마음을 전한다 */}
      <ThoughtOverlay
        loading={phase === 'AI_THINKING'}
        thought={overlayThought}
      />

      {children}

      <MicPermissionSheet
        open={micPermissionDenied}
        onClose={dismissMicPermissionNotice}
      />
    </main>
  );
};
