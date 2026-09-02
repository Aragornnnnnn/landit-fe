'use client';

// 주관식 — 비워 둬도 넘어간다. 마지막 문항이면 그 자리에서 제출한다
import { Button } from '@/shared/ui/Button';

import type { Answer } from '../../model/answers';
import type { TextQuestion } from '../../model/questions';

const MAX_LENGTH = 500;

// 비어 있으면 건너뛴다는 걸 버튼이 말한다 — 안 써도 되는 문항이라는 안내를 따로 둘 필요가 없다
const buttonLabel = (hasText: boolean, isLast: boolean) => {
  if (hasText) return isLast ? '제출하기' : '다음';
  return isLast ? '건너뛰고 제출하기' : '건너뛰기';
};

export const TextStep = ({
  question,
  answer,
  isLast,
  submitting,
  onAnswer,
  onNext,
}: {
  question: TextQuestion;
  answer: Answer | undefined;
  isLast: boolean;
  submitting: boolean;
  onAnswer: (answer: Answer) => void;
  onNext: () => void;
}) => {
  const text = typeof answer === 'string' ? answer : '';

  return (
    <>
      <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto">
        <textarea
          value={text}
          onChange={(event) => onAnswer(event.target.value)}
          maxLength={MAX_LENGTH}
          placeholder={question.placeholder}
          aria-label={question.title}
          // 화면이 넘어오자마자 쓸 수 있게 초점을 준다 — 키보드도 같이 올라온다
          autoFocus
          className="h-[180px] w-full shrink-0 resize-none rounded-2xl border border-border bg-card p-4 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>
      <Button className="mt-4" loading={submitting} onClick={onNext}>
        {buttonLabel(text.trim().length > 0, isLast)}
      </Button>
    </>
  );
};
