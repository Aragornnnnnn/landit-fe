'use client';

// 친구 초대 이벤트 화면의 문 — 환급과 상관없는 사람(기존 월간·연간 구독자)이 편지·주소로 들어오면 내 정보로 돌려보낸다
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { backToMyPage, MY_PAGE_PATH } from '@/shared/lib/routes';
import { BackHeader } from '@/shared/ui/BackHeader';

import { useReferralAudience } from '../../../_model/useReferralAudience';

export const InviteAudienceGate = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const audience = useReferralAudience();
  const outsider = audience.settled && !audience.shown;
  useEffect(() => {
    if (outsider) router.replace(MY_PAGE_PATH);
  }, [outsider, router]);

  // 누구인지 알기 전에도 본문을 그리지 않는다 — 내보낼 사람에게 초대 조건이 비치지 않게
  if (!audience.shown)
    return (
      <main className="flex h-dvh flex-col bg-background">
        <BackHeader
          title="친구 초대 이벤트"
          onBack={() => backToMyPage(router)}
        />
      </main>
    );
  return children;
};
