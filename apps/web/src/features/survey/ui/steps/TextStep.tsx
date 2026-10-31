'use client';

// 주관식 — 비워 둬도 넘어가고, 필수 문항이면 써야 넘어간다. 마지막 문항이면 그 자리에서 제출한다
import { Button } from '@/shared/ui/Button';

import type { Answer } from '../../model/answers';
import type { TextQuestion } from '../../model/questions';

const MAX_LENGTH = 500;

// 비어 있으면 건너뛴다는 걸 버튼이 말한다 — 안 써도 되는 문항이라는 안내를 따로 둘 필요가 없다
const buttonLabel = (hasText: boolean, required: boolean, isLast: boolean) => {
  if (hasText || required) return isLast ? '제출하기' : '다음';
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
  const hasText = text.trim().length > 0;
  const required = question.required === true;

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
          // 리플레이는 입력 글자를 기본으로 가린다 — 설문 답은 읽으려고 받는 것이라 보이게 둔다
          className="amp-unmask h-[180px] w-full shrink-0 resize-none rounded-2xl border border-border bg-card p-4 text-15 leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>
      <Button
        className="mt-4"
        loading={submitting}
        disabled={required && !hasText}
        onClick={onNext}
      >
        {buttonLabel(hasText, required, isLast)}
      </Button>
    </>
  );
};
