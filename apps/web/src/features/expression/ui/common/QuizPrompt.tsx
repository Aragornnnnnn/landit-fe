'use client';

// 표현 퀴즈/복습 공용 상단 — 지시문 + 대화 한 턴(상대 질문 → 내 답변). 내 말풍선엔 옮길 문장이 들어 있다
import type { Partner } from '@/features/conversation/model/character-look';

import type { SentenceQuiz } from '../../model/sentence-quiz';
import { DialogueExchange } from './DialogueExchange';

export const QuizPrompt = ({
  writingSentence,
  partner,
  instruction = '질문에 대한 대답을 완성하세요',
}: {
  writingSentence: SentenceQuiz;
  partner: Partner;
  instruction?: string;
}) => (
  <>
    <h2 className="pt-2 text-xl leading-snug font-extrabold text-foreground">
      {instruction}
    </h2>

    <div className="mt-5">
      <DialogueExchange
        partner={partner}
        question={writingSentence.writingQuestion}
        questionTranslation={writingSentence.writingQuestionTranslation}
      >
        {/* 내가 할 말 — 이 문장을 다른 언어로 조립하는 게 문제다 */}
        <p className="text-base leading-snug font-bold text-primary-foreground">
          {writingSentence.promptText}
        </p>
      </DialogueExchange>
    </div>
  </>
);
