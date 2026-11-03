// 결제자 설문 라우트 — 안내 편지로만 들어온다. 한국어 화면이 아니면 내 정보로 돌려보낸다
import { getLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { opensSurvey } from '@/features/survey/model/survey-locale';
import { SurveyFlow } from '@/features/survey/ui/SurveyFlow';
import { MY_PAGE_PATH } from '@/shared/lib/routes';

export default async function PaidSurveyPage() {
  if (!opensSurvey(await getLocale())) redirect(MY_PAGE_PATH);
  return <SurveyFlow kind="paid" />;
}
