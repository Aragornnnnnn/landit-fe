'use client';

// 표현학습의 대화 한 턴 — 상대 상반신 + 질문 말풍선(받은 메시지) 아래에 내 답변 말풍선(보낸 메시지). 퀴즈 상단(QuizPrompt)이 쓴다
import type { Partner } from '@/features/conversation/model/character-look';
import { PartnerAvatar } from '@/features/conversation/ui/character/PartnerAvatar';

import { QUIZ_VIEWBOX } from '../../model/quiz-partner';

interface DialogueExchangeProps {
  partner: Partner;
  question: string;
  questionTranslation: string;
  // 내 말풍선 안에 들어갈 내용 — 퀴즈는 옮길 문장, 예문은 강조된 영어 문장 + 해석
  children: React.ReactNode;
}

export const DialogueExchange = ({
  partner,
  question,
  questionTranslation,
  children,
}: DialogueExchangeProps) => (
  <>
    {/* 질문 — 상대 상반신(왼쪽) + 말풍선(오른쪽). 상반신을 자리 바닥에 붙인다.
        자리 크기(h-24 w-20)는 QuizStepSkeleton의 같은 자리와 맞춰야 로딩이 끝날 때 말풍선이 튀지 않는다 */}
    <div className="flex items-start gap-2">
      <span className="flex h-24 w-20 shrink-0 items-end justify-center">
        <PartnerAvatar
          partner={partner}
          viewBox={QUIZ_VIEWBOX[partner]}
          className="h-full"
        />
      </span>
      {/* 받은 메시지 — 왼쪽 위 모서리만 각지게 (채팅 코너 스타일) */}
      <div className="mt-3 flex-1 rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
        <p className="text-base leading-snug font-bold text-foreground">
          {question}
        </p>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          {questionTranslation}
        </p>
      </div>
    </div>

    {/* 내 답변 — 오른쪽 '보낸 메시지' 말풍선 */}
    <div className="mt-4 flex justify-end">
      <div className="max-w-[82%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5">
        {children}
      </div>
    </div>
  </>
);
