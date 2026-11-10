// 첫 말을 기다리는 대화 화면 — 상대를 이미 알 때 스켈레톤 대신 띄워, 기다리는 동안에도 누구와 얘기하러 왔는지 보이게 한다
'use client';

import { useTranslations } from 'next-intl';

import { CloseIcon } from '@/shared/ui/Icons';

import { toCharacterLook, type Partner } from '../model/character-look';
import type { ConversationPhase } from '../model/conversation-machine';
import { CharacterStage } from './flow/CharacterStage';
import { MicControl } from './flow/MicControl';
import { ThinkingBubble } from './flow/ThinkingBubble';

// 첫 말을 기다리는 건 대화 중 상대 답을 기다리는 단계와 같다 — 캐릭터 자세와 마이크를 그 단계에서 그대로 가져와 본편으로 넘어가도 튀지 않게
const WAITING_PHASE: ConversationPhase = 'AI_THINKING';

// 대기 화면엔 누를 것이 없다 — 마이크는 자리와 모양만 보여 준다
const ignorePress = () => {};

interface ConversationWaitingProps {
  partner: Partner;
  // 상대가 먼저 말하는 대화면 말 칸에 점 세 개를 띄워 첫 말이 곧 온다는 걸 알린다
  partnerSpeaksFirst: boolean;
  // 기다리다 그만두고 나간다 — 본편과 같은 자리에 X를 둬 넘어가는 순간 X가 새로 생기지 않게
  onExit: () => void;
}

export const ConversationWaiting = ({
  partner,
  partnerSpeaksFirst,
  onExit,
}: ConversationWaitingProps) => {
  const t = useTranslations('conversation.conversationWaiting');
  return (
    <main className="relative mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <header
        className="absolute inset-x-0 top-0 z-20 flex items-center px-3"
        style={{ paddingTop: 'max(var(--safe-area-inset-top), 8px)' }}
      >
        <button
          onClick={onExit}
          className="flex size-10 items-center justify-center text-foreground transition-transform active:scale-90"
          aria-label={t('exitButton')}
        >
          <CloseIcon size={24} />
        </button>
      </header>

      <CharacterStage
        partner={partner}
        look={toCharacterLook(WAITING_PHASE, null)}
        speech={null}
      />

      <div className="flex min-h-0 flex-1 flex-col px-5">
        {/* 상대 말 칸 — 내가 먼저 말하는 대화면 안내가 올 자리라 빈 줄로 둔다 */}
        <section className="min-h-0 flex-auto pt-2">
          {partnerSpeaksFirst ? (
            <ThinkingBubble />
          ) : (
            <div className="w-full rounded-[28px] rounded-tl-md bg-card px-5 py-5 shadow-lg shadow-black/5">
              <div className="animate-skeleton-flow h-5 w-3/4 rounded-md" />
              <div className="animate-skeleton-flow mt-3 h-5 w-1/2 rounded-md" />
            </div>
          )}
        </section>
        {/* 내 답변 칸 — 아직 쓸 말이 없어 빈 칸으로 둔다 */}
        <div className="mt-3 h-28 w-full flex-none rounded-2xl border border-border/60 bg-muted/50" />
      </div>

      <footer className="flex-none pb-[max(var(--safe-area-inset-bottom),16px)]">
        <MicControl
          phase={WAITING_PHASE}
          onPress={ignorePress}
          onCancel={ignorePress}
          onDone={ignorePress}
        />
      </footer>
    </main>
  );
};
