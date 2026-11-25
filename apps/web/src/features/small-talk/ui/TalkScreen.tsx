// 발화 시간을 쓰는 대화의 본편 화면 — 스몰톡과 롤플레이가 같이 쓴다. 시나리오 대화와 같은 무대·카드·마이크를 쓰되,
// 오늘 남은 발화 시간을 마이크 위에 두고, 끝나면 점수 대신 "얼마나 얘기했는지"를 보여준다.
// 답은 말로도 타이핑으로도 한다 — 타이핑 동안엔 발화 시간이 흐르지 않는다.
// 대화마다 다른 것(흐름 훅·종료 시트·내가 먼저 걸 때의 안내)은 화면을 쓰는 쪽이 넣는다
'use client';

import { useEffect } from 'react';
import { EVENTS } from '@landit/analytics';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import {
  toCharacterLook,
  type Partner,
} from '@/features/conversation/model/character-look';
import { toMyBubbleState } from '@/features/conversation/model/my-bubble';
import { useBubbleChoices } from '@/features/conversation/model/useBubbleChoices';
import type { useConversationTurns } from '@/features/conversation/model/useConversationTurns';
import { useTalkDisplay } from '@/features/conversation/model/useTalkDisplay';
import { CharacterStage } from '@/features/conversation/ui/flow/CharacterStage';
import { ConversationLog } from '@/features/conversation/ui/flow/ConversationLog';
import { ExitHeader } from '@/features/conversation/ui/flow/ExitHeader';
import { MicControl } from '@/features/conversation/ui/flow/MicControl';
import { MicPermissionSheet } from '@/features/conversation/ui/flow/MicPermissionSheet';
import { MyBubble } from '@/features/conversation/ui/flow/MyBubble';
import { PartnerBubble } from '@/features/conversation/ui/flow/PartnerBubble';
import { SituationCard } from '@/features/conversation/ui/flow/SituationCard';
import { ThinkingBubble } from '@/features/conversation/ui/flow/ThinkingBubble';
import { TranscriptEditor } from '@/features/conversation/ui/flow/TranscriptEditor';
import { track } from '@/shared/analytics';
import { useBackPress } from '@/shared/bridge/useBackPress';
import { useDocumentScrollPin } from '@/shared/lib/useDocumentScrollPin';
import { useKeyboardInset } from '@/shared/lib/useKeyboardInset';
import { Button } from '@/shared/ui/Button';
import { ArrowRightIcon } from '@/shared/ui/Icons';

import { toCountdownLabel } from '../lib/speaking-time';
import { useSpeakingLimit } from '../model/useSpeakingLimit';
import { TalkSummary } from './TalkSummary';

// 흐름 훅이 화면에 내주는 것 — 대화 엔진 상태에 발화 예산·종료 처리를 더한 모양이다
export type TalkScreenFlow = Pick<
  ReturnType<typeof useConversationTurns>,
  | 'phase'
  | 'turnIndex'
  | 'turn'
  | 'log'
  | 'expressedThought'
  | 'speech'
  | 'waitingForSound'
  | 'preparingAnswer'
  | 'replay'
  | 'replayPast'
  | 'interruptible'
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
  children?: React.ReactNode;
}

export const TalkScreen = ({
  sessionId,
  partner,
  flow,
  summaryPath,
  onShowSummary,
  onExitRequested,
  children,
}: TalkScreenProps) => {
  const t = useTranslations('conversation.smallTalkConversation');
  const router = useRouter();
  const display = useTalkDisplay();
  // 말풍선마다 사용자가 고른 것(글자 보임·해석 펼침) — 지난 대화가 돼도 이어 간다. 글자는 고른 적 없으면 설정을 따른다
  const bubbleChoices = useBubbleChoices(display.textHidden);
  // 결제가 열리면 하루 한도가 없다 — 남은 시간과 타이머 링을 그리지 않는다 (잔량 계산은 뒤에서 그대로 돈다)
  // 한도가 있는 무료 사용자에겐 키보드도 없다 — 타이핑은 말한 시간 0으로 보내 한도를 안 깎아, 무료 시간이 무한이 된다
  const { unlimited } = useSpeakingLimit();
  const {
    phase,
    turnIndex,
    turn,
    log,
    expressedThought,
    speech,
    waitingForSound,
    preparingAnswer,
    replay,
    replayPast,
    interruptible,
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
    reviewedInputType,
    speakAgain,
    editTranscript,
    submitReviewed,
    closeTyping,
    micPermissionDenied,
    dismissMicPermissionNotice,
  } = input;

  const ended = phase === 'DONE';
  // 타이핑 중(키보드로 쓰거나 말한 뒤 고치는 중) — 대화 칸 아래에 입력창을 열고, 마이크 영역은 접어 키보드 위 공간을 확보한다
  const typing = keyboardMode && phase === 'USER_SPEAKING';
  const myBubble = toMyBubbleState({
    phase,
    reviewing,
    typing,
    unsent: resend != null,
    text: transcript,
  });
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

  const characterLook = toCharacterLook(
    preparingAnswer ? 'AI_THINKING' : phase,
    expressedThought,
  );

  const requestExit = () => {
    // 끝난 대화·나눈 대화 없음은 흐름 훅이 알아서 보낸다 — 물어볼 때만 시트를 연다
    if (!pressClose()) return;
    track(EVENTS.CONFIRM_SHEET_OPENED, { sheet: 'conversation_exit' });
    // 동적 페이지라 받는 건 라우트 뼈대뿐이지만, 완료 응답을 기다리는 동안 먼저 받아 둔다
    router.prefetch(summaryPath);
    onExitRequested();
  };
  useBackPress(requestExit);

  return (
    <main
      className="relative isolate mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      // iOS WKWebView는 키보드가 떠도 레이아웃이 안 줄어든다 — 가려진 높이만큼 올려 입력 박스를 보이게 한다
      style={keyboardLifted ? { paddingBottom: keyboardInset } : undefined}
    >
      <ExitHeader label={t('exitButton')} onExit={requestExit} />

      <CharacterStage partner={partner} look={characterLook} speech={speech} />

      {/* 대화 칸과 키보드 입력창이 턱 선 아래 높이를 나눠 쓴다 — 무대 바로 다음이라 캐릭터 턱 아래에서 시작하고, 대화 칸이 남는 높이를 다 쓰며 넘치면 안에서 스크롤된다.
          키보드가 올라오면 대화 칸을 접고 무대가 먼저 줄어 입력창에 자리를 내준다 */}
      <div
        className={`relative z-10 flex min-h-0 flex-col ${keyboardLifted ? 'flex-initial' : 'flex-1'}`}
      >
        <ConversationLog
          entries={log}
          latestKey={turnIndex}
          latestOnly={keyboardLifted}
          // 내가 먼저 거는 대화의 첫 턴, 칸에 상황 카드뿐이면 칸 가운데에 둔다. 말을 시작하면 내 말풍선과 함께 아래에 쌓인다
          latestCentered={turn.isUserOpening && !myBubble && !preparingAnswer}
          // 지난 상대 말도 지금 차례처럼 다시 듣기·해석·가리기·속마음을 단다. 영어 글자는 그 말풍선에서 고른 대로(고른 적 없으면 설정대로) 둔다
          renderPartner={(entry) => (
            <PartnerBubble
              past
              question={entry.text}
              translation={entry.translation}
              speaking={false}
              thought={entry.thought && { status: 'shown', ...entry.thought }}
              replay={replayPast(entry)}
              translationDefaultOpen={display.translationDefaultOpen}
              onTranslationToggled={(opened) =>
                track(EVENTS.TRANSLATION_TOGGLED, {
                  session_id: sessionId,
                  turn_index: entry.turnIndex,
                  opened,
                })
              }
              textHidden={bubbleChoices.hiddenFor(entry.turnIndex)}
              collapseTranslation={bubbleChoices.translationWasOpen(
                entry.turnIndex,
              )}
              onTranslationCollapsed={() =>
                bubbleChoices.recordTranslation(entry.turnIndex, false)
              }
              onTextToggled={(visible) => {
                bubbleChoices.recordText(entry.turnIndex, visible);
                track(EVENTS.ENGLISH_TEXT_TOGGLED, {
                  session_id: sessionId,
                  turn_index: entry.turnIndex,
                  hidden: !visible,
                });
              }}
            />
          )}
        >
          {/* 내가 먼저 거는 대화의 첫 턴엔 상대 말 대신 상황 카드를 둔다. 대답이 와도 소리가 나기 전엔 새 말풍선 대신 점만 둔다 */}
          {turn.isUserOpening ? (
            <SituationCard text={turn.aiMessage} />
          ) : (
            !waitingForSound && (
              <PartnerBubble
                question={turn.aiMessage}
                translation={turn.aiTranslation}
                speaking={phase === 'AI_SPEAKING'}
                onTranslationToggled={(opened) => {
                  bubbleChoices.recordTranslation(turnIndex, opened);
                  track(EVENTS.TRANSLATION_TOGGLED, {
                    session_id: sessionId,
                    turn_index: turnIndex,
                    opened,
                  });
                }}
                replay={replay}
                textHidden={bubbleChoices.hiddenFor(turnIndex)}
                onTextToggled={(visible) => {
                  bubbleChoices.recordText(turnIndex, visible);
                  track(EVENTS.ENGLISH_TEXT_TOGGLED, {
                    session_id: sessionId,
                    turn_index: turnIndex,
                    hidden: !visible,
                  });
                }}
                translationDefaultOpen={display.translationDefaultOpen}
                thought={turn.thought}
              />
            )
          )}
          {myBubble && (
            <MyBubble
              state={myBubble}
              text={transcript}
              speechPending={speechPending}
              onEdit={editTranscript}
              typed={reviewedInputType === 'TEXT'}
            />
          )}
          {preparingAnswer && <ThinkingBubble />}
        </ConversationLog>

        {/* 끝난 뒤엔 대화 칸 아래에 이 대화의 기록을 붙인다 — 작별 인사 바로 밑이라 이 대화의 결과로 읽힌다 */}
        {ended && (
          <div className="px-5">
            <TalkSummary {...summary} />
          </div>
        )}

        {/* 키보드 입력바는 대화 칸 밖, 화면 폭으로 둔다 — 키보드가 올라와 자리가 모자라면 무대가 줄고, 입력바는 그대로 키보드 위에 선다.
            닫기 버튼 없이 위쪽을 누르거나 키보드를 내리면 닫히고, 쓴 글은 확인 말풍선으로 남는다 */}
        {typing && (
          <TranscriptEditor
            text={transcript}
            onChange={setTranscript}
            onSubmit={submitText}
            onClose={closeTyping}
          />
        )}
      </div>

      <footer
        className={`flex-none ${keyboardLifted ? '' : 'pb-[max(var(--safe-area-inset-bottom),16px)]'}`}
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
              // 캐릭터 다리 위에 겹쳐도 읽히게 흰 글자에 그림자를 둔다
              <p className="mt-3 text-center text-sm font-medium text-on-stage">
                {/* 남은 시간만 굵게 — 언어마다 앞뒤 말 순서가 달라 문구 안에 자리를 둔다 */}
                {t.rich('remainingTimeLabel', {
                  time: toCountdownLabel(remainingMs),
                  emphasis: (chunks) => (
                    <span className="font-bold">{chunks}</span>
                  ),
                })}
              </p>
            )}
            <MicControl
              phase={phase}
              interruptible={interruptible}
              onPress={pressMic}
              onKeyboard={unlimited ? pressKeyboard : undefined}
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

      {children}

      <MicPermissionSheet
        open={micPermissionDenied}
        onClose={dismissMicPermissionNotice}
      />
    </main>
  );
};
