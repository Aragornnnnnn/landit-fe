'use client';

// LAN-428 설문 안내 편지 본문 아래 버튼(임시) — 그 편지일 때만 그리고, 누르면 설문으로 간다.
// 어느 편지인지도 여기서 판단해 편지함 쪽엔 이 컴포넌트 한 줄만 남긴다
import { useRouter } from 'next/navigation';

import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';

import { isSurveyLetter } from '../model/survey-letter';

const SURVEY_PATH = '/survey';

export const SurveyLetterCta = ({ letterId }: { letterId: number }) => {
  const router = useRouter();
  if (!isSurveyLetter(letterId)) return null;

  return (
    <Button className="mt-8" onClick={() => router.push(SURVEY_PATH)}>
      <Emoji>💌</Emoji> 설문하고 이용권 받기
    </Button>
  );
};
