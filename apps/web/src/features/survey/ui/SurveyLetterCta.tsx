'use client';

// LAN-428 설문 안내 편지 본문 아래 버튼(임시) — 그 편지일 때만 그리고, 누르면 설문으로 간다.
// 어느 편지인지도 여기서 판단해 편지함 쪽엔 이 컴포넌트 한 줄만 남긴다
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';
import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';

import { isSurveyLetter } from '../model/survey-letter';

const SURVEY_PATH = '/survey';

export const SurveyLetterCta = ({ letterId }: { letterId: number }) => {
  const router = useRouter();
  if (!isSurveyLetter(letterId)) return null;

  // 어느 편지에서 눌렀는지 남긴다 — 편지를 여러 통 보내면 편지별 진입률이 갈린다
  const enter = () => {
    track(EVENTS.SURVEY_INVITE_TAPPED, { letter_id: letterId });
    router.push(SURVEY_PATH);
  };

  return (
    <Button className="mt-8" onClick={enter}>
      <Emoji>💌</Emoji> 설문하고 이용권 받기
    </Button>
  );
};
