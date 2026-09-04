'use client';

// 표현 퀴즈/복습 공용 상단 — 지시문 + 상대 얼굴 + 질문 말풍선(받은 메시지) + 내 채팅(옮길 문장) 말풍선
import type { Partner } from '@/features/conversation/model/character-look';
import { PartnerAvatar } from '@/features/conversation/ui/character/PartnerAvatar';

import { QUIZ_VIEWBOX } from '../../model/quiz-partner';
import type { SentenceQuiz } from '../../model/sentence-quiz';

export const QuizPrompt = ({
  writingSentence,
  partner,
  instruction = '질문에 대한 대답을 완성하세요',
  revealAnswer = false,
}: {
  writingSentence: SentenceQuiz;
  partner: Partner;
  instruction?: string;
  // 정답 공개 — 내 말풍선을 질문 말풍선처럼 두 줄로: 정답(조립할 문장) 위에, 옮길 문장 아래에
  revealAnswer?: boolean;
}) => (
  <>
    <h2 className="pt-2 text-xl leading-snug font-extrabold text-foreground">
      {instruction}
    </h2>

    {/* 질문 — 상대 상반신(왼쪽) + 말풍선(오른쪽). 상반신을 자리 바닥에 붙인다.
        자리 크기(h-24 w-20)는 QuizStepSkeleton의 같은 자리와 맞춰야 로딩이 끝날 때 말풍선이 튀지 않는다 */}
    <div className="mt-5 flex items-start gap-2">
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
          {writingSentence.writingQuestion}
        </p>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          {writingSentence.writingQuestionTranslation}
        </p>
      </div>
    </div>

    {/* 내가 할 말 — 오른쪽 '내 채팅' 말풍선. 이 문장을 다른 언어로 조립하는 게 문제다.
        정답 공개면 질문 말풍선과 같은 구조로, 조립할 문장(정답)을 위에 크게·옮길 문장을 아래 작게 둔다 */}
    <div className="mt-4 flex justify-end">
      <div className="max-w-[82%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5">
        <p className="text-base leading-snug font-bold text-primary-foreground">
          {revealAnswer
            ? writingSentence.answerText
            : writingSentence.promptText}
        </p>
        {revealAnswer && (
          <p className="mt-1 text-sm font-medium text-primary-foreground/80">
            {writingSentence.promptText}
          </p>
        )}
      </div>
    </div>
  </>
);
