// 대화 플로우 화면 — 캐릭터 무대·질문 카드·내 답변·마이크를 상태 기계 단계에 맞춰 오케스트레이션한다
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { SessionFeedbackScreen } from '@/features/feedback/ui/SessionFeedbackScreen';
import type { Scenario } from '@/features/scenario/api/list';
import { Transition } from '@/shared/motion';
import { Button } from '@/shared/ui/Button';
import { ArrowRightIcon, CloseIcon } from '@/shared/ui/Icons';

import { useConversationFlow } from '../model/useConversationFlow';
import { CharacterStage } from './CharacterStage';
import { ExitConfirmSheet } from './ExitConfirmSheet';
import { MicControl } from './MicControl';
import { MicPermissionSheet } from './MicPermissionSheet';
import { QuestionCard } from './QuestionCard';
import { ThoughtOverlay } from './ThoughtOverlay';
import { UserTranscript } from './UserTranscript';

export const ConversationFlow = ({ scenario }: { scenario: Scenario }) => {
  const router = useRouter();
  const [showExitModal, setShowExitModal] = useState(false);
  // 대화 종료 후 CTA를 누르면 피드백으로 넘어간다 (그 전까진 마지막 화면 + CTA를 보여준다)
  const [showFeedback, setShowFeedback] = useState(false);
  // 진입 시점의 완료 여부(재대화 판별) — 세션이 끝나면 시나리오 리스트가 invalidate돼
  // scenario.completed가 뒤늦게 true로 바뀌므로, 첫 완료와 구분하려면 진입 값으로 고정해야 한다
  const [wasCompleted] = useState(scenario.completed);
  // USER 선발화 진입 안내 — 랜디가 먼저 날아들어 말을 걸어보라고 알려주고 잠시 후 사라진다
  const [showUserFirstIntro, setShowUserFirstIntro] = useState(
    scenario.firstSpeaker === 'USER',
  );
  useEffect(() => {
    if (!showUserFirstIntro) return;
    const timer = setTimeout(() => setShowUserFirstIntro(false), 2800);
    return () => clearTimeout(timer);
  }, [showUserFirstIntro]);
  const {
    phase,
    turn,
    partner,
    transcript,
    setTranscript,
    keyboardMode,
    pressMic,
    pressKeyboard,
    cancelListening,
    finishListening,
    submitText,
    leave,
    micPermissionDenied,
    dismissMicPermissionNotice,
    sessionId,
  } = useConversationFlow(scenario);

  const ended = phase === 'DONE';
  // 대화 종료 후 CTA를 눌렀을 때만 피드백(총평·상세)으로 페이드 인해 넘어간다. 마치면 표현 학습 분기로 보낸다.
  const view = ended && showFeedback ? 'feedback' : 'conversation';

  if (view === 'feedback') {
    return (
      <Transition transitionKey="feedback" fade>
        <SessionFeedbackScreen
          sessionId={sessionId}
          title={scenario.scenarioTitle}
          onExit={() =>
            // 대화는 끝났으니 히스토리에서 지운다 — 뒤로가기로 종료된 대화에 다시 들어오지 않게.
            // 재대화(이미 완료한 시나리오)면 표현은 예전에 생성됐으니 분기 연출 없이 홈의 그 카드로 돌아간다
            wasCompleted
              ? router.replace(`/home?card=${scenario.scenarioId}`)
              : router.replace(`/expressions/${scenario.scenarioId}/branch`)
          }
        />
      </Transition>
    );
  }

  return (
    <main className="relative mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      {/* 무대가 상태바 밑까지 이어지고, X만 safe area 아래에 뜬다 — 플레인 아이콘(마이페이지와 통일) */}
      <header
        className="absolute inset-x-0 top-0 z-20 flex items-center px-3"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}
      >
        <button
          onClick={() => setShowExitModal(true)}
          className="flex size-10 items-center justify-center text-foreground transition-transform active:scale-90"
          aria-label="대화 나가기"
        >
          <CloseIcon size={24} />
        </button>
      </header>

      <CharacterStage partner={partner} />

      {/* 무대·답변·마이크는 고정. 질문만 남는 공간을 채우는 스크롤 영역에 담아, 길어져도 겹치지 않고 카드 안에서 스크롤된다 */}
      <section className="flex min-h-0 flex-1 flex-col px-5">
        {/* pt-5는 무대와의 간격이자 페이드 구간 — 위로 스크롤될 때 무대 밑에서 그림자·글자가 직각으로 잘리지 않고 서서히 사라진다 */}
        <div className="min-h-0 flex-1 overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,#000_1.25rem)] pt-5 [-webkit-mask-image:linear-gradient(to_bottom,transparent,#000_1.25rem)]">
          <QuestionCard
            question={turn.aiMessage}
            translation={turn.aiTranslation}
            speaking={phase === 'AI_SPEAKING'}
            instruction={turn.isUserOpening}
          />
        </div>
        {/* 대화가 끝나면 내 답변·마이크를 감춘다. 키보드 입력 중엔 아래 입력창이 답변을 보여주므로 중복을 피한다 */}
        {!ended && !keyboardMode && (
          <UserTranscript text={transcript} phase={phase} />
        )}
      </section>

      <footer className="flex-none pb-[max(env(safe-area-inset-bottom),16px)]">
        {ended ? (
          // 대화 종료 — 마지막 AI 발화만 남기고 마이크 대신 분석으로 가는 CTA를 아래쪽에 보여준다
          <div className="flex h-36 items-end px-5 pb-3">
            <Button onClick={() => setShowFeedback(true)}>
              상세 분석 보러갈래요
              <ArrowRightIcon size={16} />
            </Button>
          </div>
        ) : (
          <MicControl
            phase={phase}
            keyboardMode={keyboardMode}
            transcript={transcript}
            onPress={pressMic}
            onKeyboard={pressKeyboard}
            onTranscriptChange={setTranscript}
            onSubmitText={submitText}
            onCancel={cancelListening}
            onDone={finishListening}
          />
        )}
      </footer>

      {/* 속마음 — 화면 전체를 덮는 전면 연출. 제출 대기(WAITING)부터 랜디가 떠 있다가 속마음을 전한다.
          USER 선발화 진입 시엔 같은 연출로 랜디가 먼저 안내하고 사라진다 */}
      <ThoughtOverlay
        loading={phase === 'WAITING'}
        thought={
          showUserFirstIntro
            ? {
                text: '상황을 잘 읽고 먼저 말을 걸어보세요!',
                type: 'NORMAL',
              }
            : phase === 'THOUGHT'
              ? { text: turn.innerThought, type: turn.innerThoughtType }
              : null
        }
      />

      <ExitConfirmSheet
        open={showExitModal}
        onConfirm={() => {
          leave();
          // 대화를 도중에 나가면 강제로 다음 카드로 보내지 말고, 온 카드로 복귀시킨다.
          // replace로 대화를 히스토리에서 지워, 홈에서 뒤로가기 시 대화로 재진입하지 않게 한다.
          router.replace(`/home?card=${scenario.scenarioId}`);
        }}
        onClose={() => setShowExitModal(false)}
      />

      {/* 마이크 권한이 거부된 채 말하기를 누르면 설정 유도 안내를 띄운다 */}
      <MicPermissionSheet
        open={micPermissionDenied}
        onClose={dismissMicPermissionNotice}
      />
    </main>
  );
};
