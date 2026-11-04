'use client';

// LAN-428 설문 안내 편지 본문 아래 버튼(임시) — 그 편지일 때만 그리고, 누르면 그 편지의 설문으로 간다.
// 어느 편지인지도 여기서 판단해 편지함 쪽엔 이 컴포넌트 한 줄만 남긴다. 설문이 한국어로만 있어 한국어 화면에서만 그린다
import { EVENTS } from '@landit/analytics';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';
import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';

import { surveyOfLetter } from '../model/survey-letter';
import { opensSurvey } from '../model/survey-locale';
import { SURVEYS } from '../model/surveys';

export const SurveyLetterCta = ({ letterId }: { letterId: number }) => {
  const router = useRouter();
  const locale = useLocale();
  const survey = surveyOfLetter(letterId);
  if (!survey || !opensSurvey(locale)) return null;

  // 어느 편지에서 눌렀는지 남긴다 — 편지를 여러 통 보내면 편지별 진입률이 갈린다
  const enter = () => {
    track(EVENTS.SURVEY_INVITE_TAPPED, { letter_id: letterId, survey });
    router.push(SURVEYS[survey].path);
  };

  return (
    <Button className="mt-8" onClick={enter}>
      <Emoji>💌</Emoji> 설문 참여하기
    </Button>
  );
};
