'use client';

// 마이페이지 "설문" 진입점 — 문항이 한국어로만 있어서 한국어 화면에만 보인다
import { useLocale, useTranslations } from 'next-intl';

import { opensSurvey } from '@/features/survey/model/survey-locale';
import { SURVEY_PATH } from '@/shared/lib/routes';
import { Emoji } from '@/shared/ui/emoji';

import { MenuLink } from './Menu';

export const SurveyMenuEntry = () => {
  const t = useTranslations('me.page');
  const locale = useLocale();
  if (!opensSurvey(locale)) return null;
  return (
    <MenuLink
      href={SURVEY_PATH}
      icon={<Emoji>📝</Emoji>}
      title={t('surveyTitle')}
    />
  );
};
