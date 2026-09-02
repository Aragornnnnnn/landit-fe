'use client';

// 설문 안내 편지 본문 아래 버튼(임시) — 편지를 읽고 바로 설문으로 넘어가게 한다
import { useRouter } from 'next/navigation';

import { SURVEY_PATH } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';

export const SurveyLetterCta = () => {
  const router = useRouter();

  return (
    <Button className="mt-8" onClick={() => router.push(SURVEY_PATH)}>
      <Emoji>💌</Emoji> 설문하고 쿠폰 받기
    </Button>
  );
};
