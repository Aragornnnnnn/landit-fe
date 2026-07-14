// 대화 플로우 화면 — 캐릭터 무대·질문 카드·내 답변·마이크를 상태 기계 단계에 맞춰 오케스트레이션한다
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import type { Scenario } from '@/features/scenario/api/list';
import { CloseIcon } from '@/shared/ui/Icons';

import { useConversationFlow } from '../model/useConversationFlow';
import { CharacterStage } from './CharacterStage';
import { ExitConfirmSheet } from './ExitConfirmSheet';
import { ExpressionPrepScreen } from './ExpressionPrepScreen';
import { MicControl } from './MicControl';
import { QuestionCard } from './QuestionCard';
import { ThoughtOverlay } from './ThoughtOverlay';
import { UserTranscript } from './UserTranscript';

export const ConversationFlow = ({
  scenario,
  // 상대 캐릭터 성별 — 세션 API 연동 시 ttsVoice.gender로 결정한다. 연동 전까지 남자 고정.
  partner = 'male',
}: {
  scenario: Scenario;
  partner?: 'male' | 'female';
}) => {
  const router = useRouter();
  const [showExitModal, setShowExitModal] = useState(false);
  const {
    phase,
    turn,
    transcript,
    pressMic,
    cancelListening,
    finishListening,
  } = useConversationFlow(scenario);

  // 모든 턴이 끝나면 표현 준비 화면으로 전환한다 (표현학습·피드백·세션 API 연동은 후속 이슈)
  if (phase === 'DONE') {
    return <ExpressionPrepScreen scenario={scenario} />;
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

      <CharacterStage thumbnailUrl={scenario.thumbnailUrl} partner={partner} />

      <section className="flex min-h-0 flex-1 flex-col px-5 pt-5">
        <QuestionCard
          question={turn.aiMessage}
          translation={turn.aiTranslation}
          speaking={phase === 'AI_SPEAKING'}
        />
        <UserTranscript text={transcript} phase={phase} />
      </section>

      <footer className="flex-none pb-[max(env(safe-area-inset-bottom),16px)]">
        <MicControl
          phase={phase}
          onPress={pressMic}
          onCancel={cancelListening}
          onDone={finishListening}
        />
      </footer>

      {/* 속마음 — 화면 전체를 덮는 전면 연출로 이목을 모은다 */}
      <ThoughtOverlay
        thought={
          phase === 'THOUGHT'
            ? { text: turn.innerThought, type: turn.innerThoughtType }
            : null
        }
      />

      <ExitConfirmSheet
        open={showExitModal}
        onConfirm={() => router.push('/home')}
        onClose={() => setShowExitModal(false)}
      />
    </main>
  );
};
