// 대화 플로우 화면 — 캐릭터 무대·질문 카드·내 답변·마이크를 상태 기계 단계에 맞춰 오케스트레이션한다
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import type { Scenario } from '@/features/scenario/api/list';
import { Button } from '@/shared/ui/Button';
import { CloseIcon } from '@/shared/ui/Icons';

import { useConversationFlow } from '../model/useConversationFlow';
import { CharacterStage } from './CharacterStage';
import { ExitConfirmSheet } from './ExitConfirmSheet';
import { ExpressionPrepScreen } from './ExpressionPrepScreen';
import { MicControl } from './MicControl';
import { QuestionCard } from './QuestionCard';
import { ThoughtOverlay } from './ThoughtOverlay';
import { UserTranscript } from './UserTranscript';

export const ConversationFlow = ({ scenario }: { scenario: Scenario }) => {
  const router = useRouter();
  const [showExitModal, setShowExitModal] = useState(false);
  const {
    status,
    phase,
    turn,
    partner,
    transcript,
    setTranscript,
    pressMic,
    cancelListening,
    finishListening,
    leave,
  } = useConversationFlow(scenario);

  // 세션 시작 대기·실패 처리 — 시작돼야 대화 UI가 의미를 가진다
  if (status !== 'ready') {
    return (
      <main className="mx-auto flex h-dvh max-w-[430px] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        {status === 'starting' ? (
          <span className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              대화를 시작하지 못했어요.
            </p>
            <Button variant="secondary" onClick={() => router.push('/home')}>
              홈으로
            </Button>
          </>
        )}
      </main>
    );
  }

  // 모든 턴이 끝나면 표현 준비 화면으로 전환한다 (표현학습·피드백 연동은 후속 이슈)
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

      {/* 무대·답변·마이크는 고정. 질문만 남는 공간을 채우는 스크롤 영역에 담아, 길어져도 겹치지 않고 카드 안에서 스크롤된다 */}
      <section className="flex min-h-0 flex-1 flex-col px-5 pt-5">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <QuestionCard
            question={turn.aiMessage}
            translation={turn.aiTranslation}
            speaking={phase === 'AI_SPEAKING'}
          />
        </div>
        <UserTranscript text={transcript} phase={phase} />

        {/* [dev stub] STT(LAN-141) 전까지 답변을 직접 입력해 세션 API 루프를 검증한다 */}
        {process.env.NODE_ENV !== 'production' &&
          phase === 'USER_LISTENING' && (
            <input
              autoFocus
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="답변 입력 (dev · STT 대체)"
              className="mt-3 w-full rounded-xl border border-dashed border-border bg-transparent px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          )}
      </section>

      <footer className="flex-none pb-[max(env(safe-area-inset-bottom),16px)]">
        <MicControl
          phase={phase}
          onPress={pressMic}
          onCancel={cancelListening}
          onDone={finishListening}
        />
      </footer>

      {/* 속마음 — 화면 전체를 덮는 전면 연출. 제출 대기(WAITING)부터 Sona가 떠 있다가 속마음을 전한다 */}
      <ThoughtOverlay
        loading={phase === 'WAITING'}
        thought={
          phase === 'THOUGHT'
            ? { text: turn.innerThought, type: turn.innerThoughtType }
            : null
        }
      />

      <ExitConfirmSheet
        open={showExitModal}
        onConfirm={() => {
          leave();
          router.push('/home');
        }}
        onClose={() => setShowExitModal(false)}
      />
    </main>
  );
};
