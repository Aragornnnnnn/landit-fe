'use client';

// 편지 본문 아래 혜택가 버튼 — 지정한 편지에서, 혜택가를 팔 수 있는 무료 사용자에게만 그리고 누르면 시트를 연다.
// 어느 편지인지도 여기서 판단해 편지함 쪽엔 이 컴포넌트 한 줄만 남긴다
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { homePath } from '@/shared/lib/last-tab';
import { premiumOnboardingPath } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';

import {
  buildLetterOffer,
  isOfferLetter,
  type LetterOffer,
} from '../../model/letter-offer/letter-offer';
import { useSubscriptionQuery } from '../../model/my-subscription/useSubscriptionQuery';
import { useOffering } from '../../model/product/useOffering';
import { LetterOfferSheet } from './LetterOfferSheet';

export const LetterOfferCta = ({ letterId }: { letterId: number }) => {
  const target = isOfferLetter(letterId);
  // 다른 편지에서는 셸 왕복도 구독 조회도 걸지 않는다
  const offer = buildLetterOffer(useOffering({ enabled: target }));
  const { subscription } = useSubscriptionQuery({ enabled: target });
  const [open, setOpen] = useState(false);
  // 처음 연 순간의 오퍼를 붙잡아 시트를 계속 붙여 둔다 — 결제 중 구독이 유료로 바뀌어 버튼이 사라져도
  // 시트까지 내리면 진행 중인 결제가 끊겨 결제 뒤 이동이 사라진다
  const [sheetOffer, setSheetOffer] = useState<LetterOffer | null>(null);
  const router = useRouter();

  // 구독 상태를 모르면 버튼을 그리지 않는다 — 이미 유료인 사람에게 결제를 권하지 않게
  const eligible =
    target && offer && subscription && !subscription.premium ? offer : null;

  const openSheet = (current: LetterOffer) => {
    setSheetOffer(current);
    setOpen(true);
  };

  // 결제가 끝나면 페이월과 같이 프리미엄 온보딩을 거쳐 홈으로 간다
  const unlock = () => {
    setOpen(false);
    router.replace(premiumOnboardingPath(homePath()));
  };

  return (
    <>
      {eligible && (
        <Button className="mt-8" onClick={() => openSheet(eligible)}>
          <Emoji>💌</Emoji> 프리미엄 혜택가 확인하기
        </Button>
      )}
      {sheetOffer && (
        <LetterOfferSheet
          open={open}
          offer={sheetOffer}
          onClose={() => setOpen(false)}
          onUnlocked={unlock}
        />
      )}
    </>
  );
};
