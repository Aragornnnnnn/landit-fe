// 온보딩 7단계 — 추천 표현과 피드백을 맞추기 위해 배울 영어(억양)를 고른다
'use client';

import type { AccentLocale } from '@landit/analytics';
import { useTranslations } from 'next-intl';

import { lineBreak } from '@/shared/i18n/rich';

import { AccentForm } from '../common/AccentForm';

export const AccentStep = ({
  onNext,
}: {
  onNext: (locale: AccentLocale) => void;
}) => {
  const t = useTranslations('onboarding.accentStep');
  return (
    <div className="flex min-h-0 flex-1 flex-col pt-7">
      <h1 className="text-3xl leading-[1.18] font-black tracking-normal break-keep">
        {t.rich('title', lineBreak)}
      </h1>
      <p className="mt-4 text-xl font-bold text-muted-foreground">
        {t('subtitle')}
      </p>

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        <AccentForm footnote={t('hint')} onConfirm={onNext} />
      </div>
    </div>
  );
};
