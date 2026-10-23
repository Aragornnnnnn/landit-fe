'use client';

// 친구 초대 안내 편지 본문 아래 버튼 — 그 편지일 때만 그리고, 누르면 친구 초대 이벤트 화면으로 간다.
// 공유 시트를 바로 열지 않는다 — 받는 조건을 이벤트 화면에서 보고 보내게 한다. 어느 편지인지도 여기서 판단해 편지함 쪽엔 한 줄만 남긴다
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';
import { REFERRAL_INVITE_PATH } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';

import { isReferralLetter } from '../model/referral-letter';

export const ReferralLetterCta = ({ letterId }: { letterId: number }) => {
  const router = useRouter();
  if (!isReferralLetter(letterId)) return null;

  // 어느 편지에서 눌렀는지 남긴다 — 편지를 여러 통 보내면 편지별 진입률이 갈린다
  const enter = () => {
    track(EVENTS.REFERRAL_LETTER_TAPPED, { letter_id: letterId });
    router.push(REFERRAL_INVITE_PATH);
  };

  return (
    <Button className="mt-8" onClick={enter}>
      <Emoji>📤</Emoji> 친구에게 공유하기
    </Button>
  );
};
