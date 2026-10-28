'use client';

// ① 사유 선택 — 라디오 7개. 기타를 고르면 그때만 입력칸이 열리고 적어야 넘어간다. 바닥은 "다음"과 작은 "계속 이용할게요"
import type { CancelReason } from '@landit/analytics';
import { useTranslations } from 'next-intl';

import { lineBreak } from '@/shared/i18n/rich';
import { Button } from '@/shared/ui/Button';

import { canProceedFromReason, type CancelDraft } from '../_model/cancel-flow';
import {
  CANCEL_REASONS,
  OTHER_TEXT_MAX_LENGTH,
} from '../_model/cancel-reasons';
import { ChoiceRow } from './ChoiceRow';
import { StepFooter } from './StepFooter';

interface ReasonStepProps {
  draft: CancelDraft;
  onReason: (reason: CancelReason) => void;
  onOtherText: (text: string) => void;
  onNext: () => void;
  onStay: () => void;
}

const TITLE_ID = 'cancel-reason-title';

export const ReasonStep = ({
  draft,
  onReason,
  onOtherText,
  onNext,
  onStay,
}: ReasonStepProps) => {
  const t = useTranslations('subscription');
  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-4">
        <h1
          id={TITLE_ID}
          className="text-22 leading-[1.35] font-bold text-foreground"
        >
          {t.rich('reasonStep.title', lineBreak)}
        </h1>
        <div
          role="radiogroup"
          aria-labelledby={TITLE_ID}
          className="mt-6 flex flex-col gap-2"
        >
          {CANCEL_REASONS.map((reason) => (
            <ChoiceRow
              key={reason.id}
              emoji={reason.emoji}
              label={t(`cancelReasons.${reason.labelKey}`)}
              checked={draft.reason === reason.id}
              onSelect={() => onReason(reason.id)}
            />
          ))}
          {draft.reason === 'other' && (
            <label className="mt-2 block">
              <span className="mb-1.5 block text-13 font-semibold text-primary">
                {t('reasonStep.otherLabel')}
              </span>
              <textarea
                value={draft.otherText}
                onChange={(event) => onOtherText(event.target.value)}
                maxLength={OTHER_TEXT_MAX_LENGTH}
                rows={3}
                // 기타를 고른 직후라 바로 쓸 수 있게 초점을 준다
                autoFocus
                className="w-full resize-none rounded-2xl border border-primary bg-card px-4 py-3 text-14 text-foreground placeholder:text-muted-foreground focus:outline-none"
                placeholder={t('reasonStep.otherPlaceholder')}
              />
            </label>
          )}
        </div>
      </div>
      <StepFooter
        primary={
          <Button disabled={!canProceedFromReason(draft)} onClick={onNext}>
            {t('reasonStep.nextButton')}
          </Button>
        }
        link={
          <button type="button" onClick={onStay} className="underline">
            {t('reasonStep.stayButton')}
          </button>
        }
      />
    </>
  );
};
