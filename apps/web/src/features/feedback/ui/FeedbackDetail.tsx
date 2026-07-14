'use client';

// 피드백 상세 — 턴별로 질문/상황·내 답변과 GOOD/개선 분석을 한 장씩 넘겨 본다
import { useState } from 'react';

import { Button } from '@/shared/ui/Button';
import { ChevronLeftIcon } from '@/shared/ui/Icons';

import type { MessageFeedbackResponse } from '../api/session-feedback';
import { evaluationContextLabel } from '../model/feedback-view';

export const FeedbackDetail = ({
  turns,
  onBack,
  onDone,
}: {
  turns: MessageFeedbackResponse[];
  onBack: () => void;
  onDone: () => void;
}) => {
  const [index, setIndex] = useState(0);
  const turn = turns[index];
  const isLast = index === turns.length - 1;

  const goBack = () => (index > 0 ? setIndex(index - 1) : onBack());
  const goNext = () => (isLast ? onDone() : setIndex(index + 1));

  return (
    <div className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <header
        className="flex shrink-0 flex-col gap-3 px-4 pt-4 pb-3.5"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
      >
        <div className="flex items-center">
          <button
            type="button"
            onClick={goBack}
            aria-label="이전"
            className="flex h-7 w-[21px] items-center justify-center text-muted-foreground active:opacity-60"
          >
            <ChevronLeftIcon size={24} strokeWidth={2.4} />
          </button>
          <p className="flex-1 pr-[21px] text-center text-lg font-bold text-foreground">
            상세 분석
          </p>
        </div>
        <div className="flex gap-1.5">
          {turns.map((item, i) => (
            <span
              key={item.messageFeedbackId}
              className={`h-[3px] flex-1 rounded-sm ${
                i <= index ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <TurnCard turn={turn} />
      </div>

      <div
        className="shrink-0 border-t border-border px-5 pt-3"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}
      >
        <Button onClick={goNext}>
          {isLast ? '분석 다 봤어요' : '다음 분석 볼게요'}
        </Button>
      </div>
    </div>
  );
};

const TurnCard = ({ turn }: { turn: MessageFeedbackResponse }) => {
  const isGood = turn.feedbackType === 'GOOD';

  return (
    <div className="flex flex-col gap-[18px] pt-2">
      <p className="text-xl font-bold text-foreground">
        <span className="tossface">{isGood ? '✅' : '💪'}</span>{' '}
        {isGood ? '잘 통했어요' : '한 단계 더 업그레이드해봐요'}
      </p>

      <Bubble
        label={evaluationContextLabel(turn.evaluationContext.type)}
        text={turn.evaluationContext.content}
        sub={turn.evaluationContext.translatedContent}
      />
      <Bubble label="내 답변" text={turn.userMessage} align="right" />

      <div className="h-px w-full bg-border" />

      {turn.baseLocaleAnalogy && (
        <Section title="한국어로 치면">
          <NeutralBox>{turn.baseLocaleAnalogy}</NeutralBox>
        </Section>
      )}

      {isGood ? (
        <>
          {turn.feedbackDetail && (
            <Section title="잘한 이유">
              <NeutralBox>{turn.feedbackDetail}</NeutralBox>
            </Section>
          )}
          {turn.benchmarkMessage && (
            <Section title="이 디테일이 통했어요" tone="good">
              <GoodBox>{turn.benchmarkMessage}</GoodBox>
            </Section>
          )}
        </>
      ) : (
        <>
          {turn.correctionExpression && (
            <Section title="이렇게 하면 더 통해요">
              <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4">
                {/* before는 위 '내 답변'에 이미 있어 생략, 교정문만 노출 */}
                <p className="text-[15px] font-bold text-foreground">
                  {turn.correctionExpression}
                </p>
                {turn.correctionReason && (
                  <>
                    <div className="h-px w-full bg-border" />
                    <p className="text-[13px] leading-[1.6] text-muted-foreground">
                      {turn.correctionReason}
                    </p>
                  </>
                )}
              </div>
            </Section>
          )}
          {turn.positiveFeedback && (
            <Section title="이 부분은 좋았어요" tone="need">
              <NeedBox>{turn.positiveFeedback}</NeedBox>
            </Section>
          )}
        </>
      )}
    </div>
  );
};

const Bubble = ({
  label,
  text,
  sub,
  align = 'left',
}: {
  label: string;
  text: string;
  sub?: string;
  align?: 'left' | 'right';
}) => (
  <div
    className={`flex flex-col gap-1.5 ${align === 'right' ? 'items-end' : 'items-start'}`}
  >
    <p className="text-xs font-semibold text-muted-foreground">{label}</p>
    {align === 'right' ? (
      <div className="max-w-[85%] rounded-2xl rounded-br-[6px] bg-primary px-4 py-3">
        <p className="text-sm font-semibold text-primary-foreground">{text}</p>
      </div>
    ) : (
      <div className="flex max-w-[85%] flex-col gap-[3px] rounded-2xl rounded-bl-[6px] bg-muted px-4 py-3">
        <p className="text-sm leading-[1.5] text-foreground">{text}</p>
        {sub && (
          <p className="text-xs leading-[1.5] text-muted-foreground">{sub}</p>
        )}
      </div>
    )}
  </div>
);

const Section = ({
  title,
  tone = 'neutral',
  children,
}: {
  title: string;
  tone?: 'neutral' | 'good' | 'need';
  children: React.ReactNode;
}) => {
  const titleColor =
    tone === 'good'
      ? 'text-good'
      : tone === 'need'
        ? 'text-need'
        : 'text-foreground';
  return (
    <div className="flex flex-col gap-[10px]">
      <p className={`text-[13px] font-bold ${titleColor}`}>{title}</p>
      {children}
    </div>
  );
};

const NeutralBox = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <p className="text-sm leading-[1.6] text-muted-foreground">{children}</p>
  </div>
);

// GOOD 상태 하이라이트 — 파랑 (이 디테일이 통했어요)
const GoodBox = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-good-border bg-good-bg p-4">
    <p className="text-sm leading-[1.6] font-semibold text-foreground">
      {children}
    </p>
  </div>
);

// NEED IMPROVEMENT 상태 하이라이트 — 초록 (이 부분은 좋았어요)
const NeedBox = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-need-border bg-need-bg p-4">
    <p className="text-sm leading-[1.6] font-semibold text-foreground">
      {children}
    </p>
  </div>
);
