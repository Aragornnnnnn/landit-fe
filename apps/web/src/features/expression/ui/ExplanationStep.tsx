'use client';

// 표현 설명 스텝(540) — 표현 뜻·설명 + "이렇게도 써요" 예문 캐러셀
import { useSnapIndex } from '@/shared/lib/useSnapIndex';
import { Button } from '@/shared/ui/Button';

import type { PracticeSentence } from '../api/practice';
import { StepScaffold } from './StepScaffold';

interface ExplanationStepProps {
  // 표현 뜻·설명은 learning-start에서 온다(항상 있음)
  targetExpressionText: string;
  baseExpressionMeaningText: string;
  usageDescription: string;
  // "이렇게도 써요" 추가 예문 — practice에서 오며, 없으면(미시딩·404) 섹션을 생략한다
  examples: PracticeSentence[];
  title: string;
  progress: number;
  nextLabel: string; // 다음 스텝(복습 영작) 유무에 따라 "복습 영작 할게요" / "학습 완료"
  finishing?: boolean; // 마지막 스텝일 때 완료 처리 중이면 버튼 비활성
  onBack: () => void;
  leftAction?: 'back' | 'close';
  onNext: () => void;
}

export const ExplanationStep = ({
  targetExpressionText,
  baseExpressionMeaningText,
  usageDescription,
  examples,
  title,
  progress,
  nextLabel,
  finishing,
  onBack,
  leftAction,
  onNext,
}: ExplanationStepProps) => {
  // 중앙에 가장 가까운 카드가 활성 dot — snap-center와 정확히 일치한다 (홈 리스트와 같은 공용 훅)
  const { scrollRef, activeIndex: active, onScroll } = useSnapIndex('x');

  return (
    <StepScaffold
      title={title}
      progress={progress}
      onBack={onBack}
      leftAction={leftAction}
      footer={
        <Button onClick={onNext} disabled={finishing}>
          {nextLabel}
        </Button>
      }
    >
      <div className="pt-2 pb-6">
        <div className="rounded-2xl bg-primary/10 px-5 py-4">
          <p className="text-2xl font-extrabold text-primary">
            {targetExpressionText}
          </p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {baseExpressionMeaningText}
          </p>
          <p className="mt-3 text-base leading-relaxed font-medium text-foreground">
            {usageDescription}
          </p>
        </div>

        {examples.length > 0 && (
          <>
            <div className="mt-6 mb-3 flex items-baseline justify-between">
              <p className="text-lg font-extrabold text-foreground">
                이렇게도 써요
              </p>
              {examples.length > 1 && (
                <p className="text-sm font-medium text-muted-foreground">
                  옆으로 넘겨봐요
                </p>
              )}
            </div>

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
          </>
        )}
      </div>
    </StepScaffold>
  );
};

// 예문 카드 — 이미지 + Q(질문) / A(표현 활용 문장). A는 강조 구간만 굵게.
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
        <span className="tossface text-4xl">🖼️</span>
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
      <span className="text-primary">{highlight}</span>
      {text.slice(index + highlight.length)}
    </>
  );
};
