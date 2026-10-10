'use client';

// 사유별 화면(②·③) — 이모지 → 제목 → 본문 → 카드 → 주 버튼 → 작은 해지 링크. 내용은 전부 _model/retention-content가 준다
import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';

import type {
  RetentionCard,
  RetentionContent,
} from '../_model/retention-content';
import { StepFooter } from './StepFooter';

const CARD_CLASS = 'rounded-2xl bg-muted px-4 py-3.5';

const Card = ({ card }: { card: RetentionCard }) => {
  if (card.kind === 'stat') {
    return (
      <dl className={`${CARD_CLASS} flex divide-x divide-border`}>
        {card.items.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center">
            <dd className="text-[18px] font-bold text-foreground">
              {item.value}
            </dd>
            <dt className="mt-0.5 text-[13px] text-muted-foreground">
              {item.label}
            </dt>
          </div>
        ))}
      </dl>
    );
  }
  if (card.kind === 'quote') {
    return (
      <figure className={CARD_CLASS}>
        <figcaption className="text-[13px] text-muted-foreground">
          {card.label}
        </figcaption>
        <blockquote className="mt-1 text-[15px] text-foreground">
          “{card.text}”
        </blockquote>
      </figure>
    );
  }
  return (
    <dl className={`${CARD_CLASS} flex items-center justify-between gap-3`}>
      <dt className="text-[14px] text-muted-foreground">
        {card.label}
        {card.sublabel && (
          <span className="mt-0.5 block text-[12px]">{card.sublabel}</span>
        )}
      </dt>
      <dd className="shrink-0 text-[18px] font-bold text-foreground">
        {card.value}
      </dd>
    </dl>
  );
};

interface RetentionStepProps {
  content: RetentionContent;
  onPrimary: () => void;
  leaveLink: React.ReactNode;
}

export const RetentionStep = ({
  content,
  onPrimary,
  leaveLink,
}: RetentionStepProps) => (
  <>
    <div className="flex flex-1 flex-col items-center overflow-y-auto px-5 pt-9 pb-4 text-center">
      <Emoji className="text-[84px]">{content.emoji}</Emoji>
      <h1 className="mt-5 text-[22px] leading-[1.35] font-bold text-foreground">
        {content.title}
      </h1>
      <p className="mt-2 text-[15px] leading-[1.55] text-muted-foreground">
        {content.body.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
      {content.cards.length > 0 && (
        <div className="mt-6 flex w-full flex-col gap-2 text-left">
          {content.cards.map((card, index) => (
            <Card key={index} card={card} />
          ))}
        </div>
      )}
    </div>
    <StepFooter
      primary={<Button onClick={onPrimary}>{content.primary.label}</Button>}
      link={leaveLink}
    />
  </>
);
