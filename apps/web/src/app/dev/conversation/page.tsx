'use client';

// [임시] 대화 플로우 UI 프리뷰(개발 전용) — 로그인 없이 고정 시나리오로 화면을 확인한다. 프로덕션에선 404.
import { useState } from 'react';
import { notFound } from 'next/navigation';

import { ConversationFlow } from '@/features/conversation/ui/ConversationFlow';
import { ThoughtOverlay } from '@/features/conversation/ui/ThoughtOverlay';
import type { Scenario } from '@/features/scenario/api/list';

const FIXTURE: Scenario = {
  scenarioId: 1,
  starRating: null,
  displayOrder: 1,
  scenarioTitle: '카페에서 주문하기',
  briefing: '점원에게 커피를 주문해보세요.',
  conversationGoal: '음료를 주문하고 결제까지 마친다',
  difficulty: 'EASY',
  firstSpeaker: 'AI',
  thumbnailUrl: null,
  completed: false,
  locked: false,
  lockReason: null,
  openingPreview: {
    aiOpeningMessage:
      'Hi! Welcome to Landit Coffee. What can I get for you today?',
    aiOpeningMessageTranslation: '어서 오세요! 오늘은 뭘 드릴까요?',
    userOpeningInstruction: null,
    innerThought: '주문을 한 번에 알아들었어! 발음이 또렷했어.',
    innerThoughtType: 'GOOD',
    ttsVoiceSetId: null,
  },
};

export default function ConversationPreviewPage() {
  // 속마음 연출 튜닝용 고정 토글 — 우하단 버튼으로 오버레이를 계속 띄워둔 채 확인한다
  const [pinThought, setPinThought] = useState(false);
  // 캐릭터 에셋 확인용 남/여 토글 — 실제 선택은 세션 TTS 성별이 맡는다
  const [partner, setPartner] = useState<'male' | 'female'>('male');

  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <>
      <ConversationFlow scenario={FIXTURE} partner={partner} />
      <div className="fixed right-3 bottom-3 z-[60] flex gap-2">
        <button
          onClick={() =>
            setPartner((prev) => (prev === 'male' ? 'female' : 'male'))
          }
          className="rounded-full bg-foreground/80 px-3 py-1.5 text-xs font-semibold text-background"
        >
          {partner === 'male' ? '남자' : '여자'}
        </button>
        <button
          onClick={() => setPinThought((prev) => !prev)}
          className="rounded-full bg-foreground/80 px-3 py-1.5 text-xs font-semibold text-background"
        >
          속마음 {pinThought ? '숨기기' : '고정'}
        </button>
      </div>
      {pinThought && (
        <ThoughtOverlay
          thought={{
            text: FIXTURE.openingPreview!.innerThought!,
            type: 'GOOD',
          }}
        />
      )}
    </>
  );
}
