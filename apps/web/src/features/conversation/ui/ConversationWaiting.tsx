// 첫 말을 기다리는 대화 화면 — 상대를 이미 알 때 스켈레톤 대신 띄워, 기다리는 동안에도 누구와 얘기하러 왔는지 보이게 한다
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { toCharacterLook, type Partner } from '../model/character-look';
import type { ConversationPhase } from '../model/conversation-machine';
import { CharacterStage } from './flow/CharacterStage';
import { ExitHeader } from './flow/ExitHeader';
import { MicControl } from './flow/MicControl';
import { SituationCardSkeleton } from './flow/SituationCard';
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
  // 한 번 누르면 잠근다 — 연타로 정리 요청과 이동이 겹치지 않게
  const [leaving, setLeaving] = useState(false);
  const leave = () => {
    setLeaving(true);
    onExit();
  };
  return (
    <main className="relative isolate mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <ExitHeader label={t('exitButton')} onExit={leave} disabled={leaving} />

      <CharacterStage
        partner={partner}
        look={toCharacterLook(WAITING_PHASE, null)}
        speech={null}
      />

      {/* 대화 칸 — 진짜 대화 칸처럼 아래(마이크 바로 위)부터 쌓는다. 첫 말이 오면 그 자리에 말풍선이 들어와 튀지 않는다.
          내가 먼저 말하는 대화면 상황 카드가 올 자리(칸 가운데)에 빈 카드를 둔다 */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-end px-4 pb-3">
        {partnerSpeaksFirst ? (
          <ThinkingBubble />
        ) : (
          <div className="flex flex-1 flex-col justify-center">
            <SituationCardSkeleton />
          </div>
        )}
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
