// 시나리오 대화 화면 — features/scenario(콘텐츠)를 재료로 features/conversation 엔진을 진행시킨다.
// 캐릭터 무대·질문 카드·내 답변·마이크를 상태 기계 단계에 맞춰 오케스트레이션한다
'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { EVENTS } from '@landit/analytics';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { toCharacterLook } from '@/features/conversation/model/character-look';
import { toMyBubbleState } from '@/features/conversation/model/my-bubble';
import { useTalkDisplay } from '@/features/conversation/model/useTalkDisplay';
import { CharacterStage } from '@/features/conversation/ui/flow/CharacterStage';
import { ConversationLog } from '@/features/conversation/ui/flow/ConversationLog';
import { ExitConfirmSheet } from '@/features/conversation/ui/flow/ExitConfirmSheet';
import { ExitHeader } from '@/features/conversation/ui/flow/ExitHeader';
import { MicControl } from '@/features/conversation/ui/flow/MicControl';
import { MicPermissionSheet } from '@/features/conversation/ui/flow/MicPermissionSheet';
import { MyBubble } from '@/features/conversation/ui/flow/MyBubble';
import { PartnerBubble } from '@/features/conversation/ui/flow/PartnerBubble';
import { SituationCard } from '@/features/conversation/ui/flow/SituationCard';
import { ThinkingBubble } from '@/features/conversation/ui/flow/ThinkingBubble';
import { TranscriptEditor } from '@/features/conversation/ui/flow/TranscriptEditor';
import type { Scenario } from '@/features/scenario/lib/to-scenario';
import { track } from '@/shared/analytics';
import { useBackPress } from '@/shared/bridge/useBackPress';
import { scenarioFeedbackPath, scenarioReturnPath } from '@/shared/lib/routes';
import { useDocumentScrollPin } from '@/shared/lib/useDocumentScrollPin';
import { useKeyboardInset } from '@/shared/lib/useKeyboardInset';
import { Button } from '@/shared/ui/Button';
import { ArrowRightIcon } from '@/shared/ui/Icons';
import { ProgressBar } from '@/shared/ui/ProgressBar';

import { useAnswerGuideToggle } from '../_model/useAnswerGuideToggle';
import { useScenarioTalkFlow } from '../_model/useScenarioTalkFlow';
import { AnswerGuide } from './AnswerGuide';

export const ScenarioTalkFlow = ({
  scenario,
  date,
}: {
  scenario: Scenario;
  // 어느 날 카드에서 들어왔는지. 나갈 때 그 날로 돌려보낸다
  date?: string;
}) => {
  const t = useTranslations('conversation.scenarioTalkFlow');
  const router = useRouter();
  const [showExitModal, setShowExitModal] = useState(false);
  const requestExit = () => {
    track(EVENTS.CONFIRM_SHEET_OPENED, { sheet: 'conversation_exit' });
    setShowExitModal(true);
  };
  const display = useTalkDisplay();
  // 진입 시점의 완료 여부(재대화 판별) — 세션이 끝나면 시나리오 리스트가 invalidate돼
  // scenario.completed가 뒤늦게 true로 바뀌므로, 첫 완료와 구분하려면 진입 값으로 고정해야 한다.
  // 피드백 화면은 이 값을 다시 구할 수 없어 주소로 넘긴다
  const [wasCompleted] = useState(scenario.completed);
  // USER 선발화 진입 안내 — 랜디가 먼저 날아들어 말을 걸어보라고 알려주고 잠시 후 사라진다.
  // 판정은 turn.isUserOpening 한 곳에 위임하고(카드 안내 구조와 같은 소스), 여기선 노출 시간만 관리한다.
  const {
    phase,
    turnIndex,
    turn,
    log,
    partner,
    expressedThought,
    speech,
    waitingForSound,
    preparingAnswer,
    replay,
    interruptible,
    input,
    resend,
    leave,
    sessionId,
    gauge,
    answerGuide,
    markGuideViewed,
  } = useScenarioTalkFlow(scenario);
  useBackPress(() => requestExit());
  const {
    transcript,
    speechPending,
    setTranscript,
    keyboardMode,
    pressMic,
    pressKeyboard,
    cancelInput,
    finishListening,
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
  // 키보드 입력 중 — 대화 칸 아래에 입력창을 열고, 마이크 영역은 접어 키보드 위 공간을 확보한다
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
  // 답변 가이드 — 내 차례(대기·말하는 중)에만 대화 칸의 내 다음 말 자리에 선다. 말하는 동안엔 내 말풍선이 그 아래에 붙는다.
  // 키보드로 쓰는 중엔 대화 칸이 접히고, 답을 낸 뒤엔 방금 한 말을 보여야 해서 비켜 준다
  const myTurn = phase === 'USER_READY' || phase === 'USER_SPEAKING';
  // 답변이 전달되지 못한 동안은 다시 보내기가 먼저라 가이드를 비켜 준다 — 펼쳐 둔 카드가 실패한 답변을 덮지 않게.
  // 말한 뒤 확인 중에도 비켜 준다 — 인식된 문장을 고칠지 보내는 데 집중하게
  const guideShown =
    answerGuide != null && myTurn && !typing && !reviewing && resend == null;
  const guideChipRef = useRef<HTMLButtonElement>(null);
  // 첫 질문의 턴 — USER 선발화면 0번은 상황 안내라 첫 AI 질문은 그다음이다
  const firstQuestionIndex = scenario.firstSpeaker === 'USER' ? 1 : 0;
  const guide = useAnswerGuideToggle({
    question: turn.aiMessage,
    available: answerGuide != null && !ended,
    // 유도 힌트는 첫 질문의 음성이 끝나 내 차례가 된 순간에만 — 말 없이 나가는 사람 대부분이 그 직후에 나간다
    hintable: turnIndex === firstQuestionIndex && phase === 'USER_READY',
    onToggled: (opened, fromHint) => {
      if (opened) markGuideViewed();
      track(EVENTS.ANSWER_GUIDE_TOGGLED, {
        session_id: sessionId ?? undefined,
        scenario_id: scenario.scenarioId,
        turn_index: turnIndex,
        opened,
        from_hint: fromHint,
      });
    },
  });
  // 캐릭터 자세 — 평소엔 단계를 따르고(대답 준비 중엔 생각하는 자세), 속마음이 말풍선에 뜨면 그 감정 표정이 잠깐 얹힌다
  const characterLook = toCharacterLook(
    preparingAnswer ? 'AI_THINKING' : phase,
    expressedThought,
  );
  // 대화 종료 후 CTA를 누르면 피드백 라우트로 넘어간다. 대화는 끝났으니 히스토리에서 지운다(replace) —
  // 뒤로가기로 종료된 대화에 다시 들어와 세션이 새로 시작되지 않게
  const feedbackPath = scenarioFeedbackPath(scenario.scenarioId, {
    session: sessionId,
    date,
    replay: wasCompleted,
  });
  // 마지막 발화가 끝나면 피드백 라우트를 미리 받아 둔다 — CTA가 버튼이라 링크 자동 프리페치가 안 걸리고,
  // 누르는 순간 받으면 늦다
  useEffect(() => {
    if (ended) router.prefetch(feedbackPath);
  }, [ended, feedbackPath, router]);
  // 라우트 전환은 새 화면이 준비될 때까지 이 화면에 머문다 — 그동안 버튼이 돌아가야 눌린 줄 안다
  const [leavingForFeedback, startLeaving] = useTransition();
  const goToFeedback = () => {
    // 화면은 피드백으로 갈아타도 이 훅은 살아 있다 — 작별 인사를 다시 듣던 중이면 여기서 끊는다
    if (replay?.playing) replay.toggle();
    startLeaving(() => router.replace(feedbackPath));
  };

  return (
    <main
      className="relative isolate mx-auto flex h-dvh max-w-[430px] flex-col bg-background"
      // iOS WKWebView는 키보드가 떠도 레이아웃이 안 줄어든다 — 가려진 높이만큼 올려 입력 박스를 보이게 한다
      style={keyboardLifted ? { paddingBottom: keyboardInset } : undefined}
    >
      {/* 진행 게이지 — 표현 학습 스텝과 같은 자리(상태바 바로 아래)·같은 모양이라 무대 위에 띄운다 */}
      <div
        className="absolute inset-x-0 z-20"
        style={{ top: 'var(--safe-area-inset-top)' }}
      >
        <ProgressBar
          progress={gauge.ratio}
          tone={gauge.tone}
          label={t('progressLabel')}
        />
      </div>

      {/* 무대가 상태바 밑까지 이어지고, X만 safe area 아래에 뜬다 — 플레인 아이콘(마이페이지와 통일) */}
      <ExitHeader label={t('exitButton')} onExit={requestExit} />

      <CharacterStage partner={partner} look={characterLook} speech={speech} />

      {/* 대화 칸과 키보드 입력창이 턱 선 아래 높이를 나눠 쓴다 — 무대 바로 다음이라 캐릭터 턱 아래에서 시작하고, 대화 칸이 남는 높이를 다 쓰며 넘치면 안에서 스크롤된다.
          키보드가 올라오면 대화 칸을 접고 무대가 먼저 줄어 입력창에 자리를 내준다 */}
      <div
        className={`relative z-10 flex min-h-0 flex-col ${keyboardLifted ? 'flex-initial' : 'flex-1'}`}
      >
        <ConversationLog entries={log} latestKey={turnIndex}>
          {/* 내가 먼저 거는 대화의 첫 턴엔 상대 말 대신 상황 카드를 둔다. 대답이 와도 소리가 나기 전엔 새 말풍선 대신 점만 둔다 */}
          {turn.isUserOpening ? (
            <SituationCard
              text={turn.aiMessage}
              alone={!myBubble && !preparingAnswer}
            />
          ) : (
            !waitingForSound && (
              <PartnerBubble
                question={turn.aiMessage}
                translation={turn.aiTranslation}
                speaking={phase === 'AI_SPEAKING'}
                lastQuestion={gauge.lastQuestion}
                onTranslationToggled={(opened) =>
                  track(EVENTS.TRANSLATION_TOGGLED, {
                    session_id: sessionId ?? undefined,
                    turn_index: turnIndex,
                    opened,
                  })
                }
                replay={replay}
                textHidden={display.textHidden}
                onTextToggled={(visible) =>
                  track(EVENTS.ENGLISH_TEXT_TOGGLED, {
                    session_id: sessionId ?? undefined,
                    turn_index: turnIndex,
                    hidden: !visible,
                  })
                }
                translationDefaultOpen={display.translationDefaultOpen}
                thought={turn.thought}
              />
            )
          )}
          {guideShown && answerGuide && (
            <AnswerGuide
              guide={answerGuide}
              open={guide.open}
              onOpen={guide.openGuide}
              onClose={() => {
                guide.closeGuide();
                // 다시 나타난 알약으로 포커스를 돌려준다 — 알약은 이번 렌더가 끝난 뒤에 붙는다
                requestAnimationFrame(() =>
                  guideChipRef.current?.focus({ preventScroll: true }),
                );
              }}
              hintVisible={guide.hintVisible}
              chipRef={guideChipRef}
            />
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
          // 대화 종료 — 마지막 AI 발화만 남기고 마이크 대신 분석으로 가는 CTA를 아래쪽에 보여준다
          <div className="flex h-36 items-end px-5 pb-3">
            <Button onClick={goToFeedback} loading={leavingForFeedback}>
              {t('feedbackButton')}
              <ArrowRightIcon size={16} />
            </Button>
          </div>
        ) : typing ? null : (
          <MicControl
            phase={phase}
            interruptible={interruptible}
            onPress={() => {
              guide.dismissHint();
              pressMic();
            }}
            onKeyboard={() => {
              guide.collapseGuide();
              pressKeyboard();
            }}
            onCancel={cancelInput}
            onDone={() => {
              // 펼쳐 둔 가이드는 접어 둔다 — 확인 뒤 다시 말하기로 돌아와도 접힌 채로 시작한다
              guide.collapseGuide();
              finishListening();
            }}
            onResend={resend}
            review={
              reviewing
                ? { onRetry: speakAgain, onSend: submitReviewed }
                : undefined
            }
          />
        )}
      </footer>

      <ExitConfirmSheet
        open={showExitModal}
        onConfirm={() => {
          leave();
          // 대화를 도중에 나가면 강제로 다음 카드로 보내지 말고, 온 카드로 복귀시킨다.
          // replace로 대화를 히스토리에서 지워, 홈에서 뒤로가기 시 대화로 재진입하지 않게 한다.
          router.replace(scenarioReturnPath({ date }));
        }}
        onClose={() => {
          track(EVENTS.CONFIRM_SHEET_DISMISSED, { sheet: 'conversation_exit' });
          setShowExitModal(false);
        }}
      />

      {/* 마이크 권한이 거부된 채 말하기를 누르면 설정 유도 안내를 띄운다 */}
      <MicPermissionSheet
        open={micPermissionDenied}
        onClose={dismissMicPermissionNotice}
      />
    </main>
  );
};
