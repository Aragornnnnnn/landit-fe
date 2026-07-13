'use client';

// 표현 퀴즈/복습 공용 상단 — 지시문 + 캐릭터 + 질문 말풍선(받은 메시지) + 내 채팅(한글) 말풍선
import type { WritingSentence } from '../api/practice';

export const QuizPrompt = ({
  writingSentence,
  instruction = '질문에 대한 대답을 완성하세요',
}: {
  writingSentence: WritingSentence;
  instruction?: string;
}) => (
  <>
    <h2 className="pt-2 text-xl leading-snug font-extrabold text-foreground">
      {instruction}
    </h2>

    {/* 질문 — 사람 캐릭터(왼쪽) + 말풍선(오른쪽) */}
    <div className="mt-5 flex items-start gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- 로컬 public 캐릭터 일러스트, next/image 원격 설정 불필요 */}
      <img
        src="/images/character/partner-male.webp"
        alt=""
        className="h-32 w-24 shrink-0 object-contain object-bottom"
      />
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

    {/* 내가 할 말(한글) — 오른쪽 '내 채팅' 말풍선 */}
    <div className="mt-4 flex justify-end">
      <div className="max-w-[82%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5">
        <p className="text-base leading-snug font-bold text-primary-foreground">
          {writingSentence.writingSentenceTranslation}
        </p>
      </div>
    </div>
  </>
);
