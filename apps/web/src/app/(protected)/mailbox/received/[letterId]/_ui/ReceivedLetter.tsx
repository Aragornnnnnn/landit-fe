'use client';

// 받은 편지 화면 — 친구 초대 버튼을 붙일 사람인지(환급 대상 판정)만 라우트 층에서 정해 편지함에 넘긴다
import { ReceivedLetterFlow } from '@/features/mailbox/ui/LetterDetailFlow';

import { useReferralAudience } from '../../../../_model/useReferralAudience';

export const ReceivedLetter = ({ letterId }: { letterId: number }) => {
  const { shown } = useReferralAudience();
  return <ReceivedLetterFlow letterId={letterId} canInvite={shown} />;
};
