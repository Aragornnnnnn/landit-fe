'use client';

// 추가 예문 스텝 — "이렇게도 써요" 예문 카드 캐러셀(이미지 + Q/A). 복습 퀴즈 직전에 표현 쓰임새를 눈으로 익힌다
import { useEffect } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { useSnapIndex } from '@/shared/lib/useSnapIndex';
import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';

import type { PracticeSentence } from '../../api/practice';
import { StepScaffold } from '../common/StepScaffold';

interface ExamplesStepProps {
  // 계측 속성용 — 어떤 표현의 예문인지
  expressionId: number;
  examples: PracticeSentence[];
  // 헤더 제목 — 표현 뜻
  title: string;
  progress: number;
  onBack: () => void;
  // 발음 없는 표현은 예문이 퀴즈 다음 첫 화면이라 ‹ 대신 X(나가기)다
  leftAction?: 'back' | 'close';
  onNext: () => void;
}

export const ExamplesStep = ({
  expressionId,
  examples,
  title,
  progress,
  onBack,
  leftAction,
  onNext,
}: ExamplesStepProps) => {
  // 중앙에 가장 가까운 카드가 활성 dot — snap-center와 정확히 일치한다 (홈 리스트와 같은 공용 훅)
  const { scrollRef, activeIndex: active, onScroll } = useSnapIndex('x');

  // 첫 장 포함, 캐러셀 스냅으로 예문이 바뀔 때마다 노출로 기록한다
  useEffect(() => {
    track(EVENTS.EXAMPLE_SENTENCE_VIEWED, {
      expression_id: expressionId,
      sentence_index: active,
    });
  }, [expressionId, active]);

  return (
    <StepScaffold
      title={title}
      progress={progress}
      onBack={onBack}
      leftAction={leftAction}
      footer={
        <Button size="md" onClick={onNext}>
          복습 퀴즈 풀게요
        </Button>
      }
    >
      <div className="pt-2 pb-6">
        {/* 스와이프 힌트 문구는 뺐다 — 도트와 빼꼼 보이는 다음 카드가 넘김을 이미 말해준다 */}
        <p className="mb-3 text-lg font-extrabold text-foreground">
          이렇게도 써요
        </p>

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5"
        >
          {examples.map((sentence, index) => (
            <ExampleCard key={index} sentence={sentence} />
          ))}
        </div>

        {examples.length > 1 && (
          <div className="mt-4 flex justify-center gap-1.5">
            {examples.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === active ? 'w-4 bg-primary' : 'w-1.5 bg-border'
                }`}
              />
            ))}
          </div>
        )}

        {/* 래디의 예고 — 복습 퀴즈는 이 예문들이 아니라 다른 문장으로 나오므로 "이 중 하나"라고 하지 않는다 */}
        <div className="mt-6 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/character/landy-point.webp"
            alt=""
            className="w-16 flex-none object-contain"
          />
          <div className="rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-2.5 text-sm leading-snug font-semibold break-keep text-foreground">
            표현 쓰임새가 보이죠? 이제 마무리 퀴즈를 풀어볼 거예요
          </div>
        </div>
      </div>
    </StepScaffold>
  );
};

// 예문 카드 — 이미지 + Q(질문) / A(표현 활용 문장). A는 강조 구간만 주황으로.
const ExampleCard = ({ sentence }: { sentence: PracticeSentence }) => (
  <div className="w-[280px] shrink-0 snap-center snap-always overflow-hidden rounded-2xl border border-border bg-card">
    <div className="flex aspect-square items-center justify-center bg-secondary">
      {sentence.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- 예문 이미지 도메인 미정이라 next/image 원격 허용 목록을 아직 못 만든다
        <img
          src={sentence.imageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <Emoji className="text-4xl">🖼️</Emoji>
      )}
    </div>
    <div className="flex flex-col gap-2 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">
          <QaBadge label="Q" /> {sentence.practiceQuestion}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {sentence.practiceQuestionTranslation}
        </p>
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">
          <QaBadge label="A" />{' '}
          <HighlightedSentence
            text={sentence.sentenceText}
            highlight={sentence.highlightingPart}
          />
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {sentence.sentenceTranslation}
        </p>
      </div>
    </div>
  </div>
);

const QaBadge = ({ label }: { label: string }) => (
  <span className="mr-0.5 inline-flex size-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground">
    {label}
  </span>
);

// 표현 구간만 주황으로 — 못 찾으면 그대로
const HighlightedSentence = ({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) => {
  const index = highlight ? text.indexOf(highlight) : -1;
  if (index === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <span data-highlight className="text-primary">
        {highlight}
      </span>
      {text.slice(index + highlight.length)}
    </>
  );
};
