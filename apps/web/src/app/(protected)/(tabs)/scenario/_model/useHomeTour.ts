// 홈의 첫 표현 투어 지휘 — 이어하기 안내·챌린지 소개·카드 코치·페이월 이동을 차례로 낸다
'use client';

import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { isTourLive, markTourLive } from '@/features/tour/model/tour-session';
import { track } from '@/shared/analytics';
import { paywallPath } from '@/shared/lib/routes';

import { useFirstExpressionTour } from '../../../_model/useFirstExpressionTour';
import { useRewardOffer } from '../../../_model/useRewardOffer';
import { homeTourViewOf } from './home-tour-view';

/**
 * @param cleared 오늘 카드를 끝냈는가
 * @param showerHold 돌아온 순간의 동전 연출이 아직 도는가
 */
export const useHomeTour = ({
  cleared,
  showerHold,
}: {
  cleared: boolean;
  showerHold: boolean;
}) => {
  const router = useRouter();
  const tour = useFirstExpressionTour();
  const [live, setLive] = useState(isTourLive);
  const view = homeTourViewOf({
    screen: tour.screen,
    live,
    cleared,
    showerHold,
  });
  const offer = useRewardOffer({ enabled: view === 'challenge_intro' });

  // 표현을 끝내고 페이월을 보기 전에 나갔다 — 한 번만 보낸다
  const sent = useRef(false);
  useEffect(() => {
    if (view !== 'paywall' || sent.current) return;
    sent.current = true;
    track(EVENTS.PAYWALL_GATE_LOCKED, { source: 'first_expression_tour' });
    router.push(paywallPath({ source: 'first_expression_tour' }));
  }, [view, router]);

  return {
    view,
    // 투어가 진행 중이면 홈의 다른 시트(소감·알림 동의)는 미룬다
    active: tour.screen !== 'none',
    // 무료 표현 차례면 카드를 뒷면으로 펴 둔다
    openBack: view === 'card' && tour.screen === 'free_expression',
    offer,
    resume: () => {
      markTourLive();
      setLive(true);
    },
    closeIntro: () => tour.saveStep('CHALLENGE_INTRO_SEEN'),
    cardTour:
      view === 'card' &&
      (tour.screen === 'auto_flip' || tour.screen === 'free_expression')
        ? {
            screen: tour.screen,
            onFlipped: () => tour.saveStep('CARD_FLIPPED'),
            // 열어 줄 표현이 없으면 페이월로 몰지 않고 조용히 끝낸다
            onNoFreeExpression: () => tour.saveStep('COMPLETED'),
          }
        : undefined,
  };
};
