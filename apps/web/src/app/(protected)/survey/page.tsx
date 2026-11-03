// 설문 라우트 — feature 조립만 담당하는 얇은 층. 한국어 화면이 아니면 편지·주소로 들어와도 내 정보로 돌려보낸다
import { getLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { opensSurvey } from '@/features/survey/model/survey-locale';
import { SurveyFlow } from '@/features/survey/ui/SurveyFlow';
import { MY_PAGE_PATH } from '@/shared/lib/routes';

export default async function SurveyPage() {
  if (!opensSurvey(await getLocale())) redirect(MY_PAGE_PATH);
  return <SurveyFlow kind="general" />;
}
