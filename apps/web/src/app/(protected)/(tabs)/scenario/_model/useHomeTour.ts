// 홈의 첫 표현 투어 지휘 — 튜토리얼과 카드 뒤집기·무료 표현을 차례로 낸다
'use client';

import { useEffect } from 'react';

// 가로 import 사유: 투어 끝에 이어지는 환급 페이월의 첫 화면 그림을 미리 받는다
import { SCENARIO_WALL_IMAGES } from '@/app/(protected)/paywall/_model/paywall-content';
import { preloadImages } from '@/shared/lib/preload-next-images';

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
  const tour = useFirstExpressionTour();
  const view = homeTourViewOf({ screen: tour.screen, cleared, showerHold });
  // 가격은 투어가 있는 동안 미리 받는다 — 튜토리얼이 뜨기 전에 받아 두어야 금액이 등록가로 굳지 않는다
  const offer = useRewardOffer({ enabled: tour.screen !== 'none' });
  // 무료 표현을 마치면 환급 페이월로 간다 — 그 차례가 오면 페이월 첫 화면의 카드 벽 그림을 미리 받는다
  useEffect(() => {
    if (tour.screen === 'free_expression') preloadImages(SCENARIO_WALL_IMAGES);
  }, [tour.screen]);

  return {
    view,
    // 투어가 화면에 있으면 홈의 다른 시트(소감·알림 동의)는 미룬다
    active: view !== 'none',
    dailyWon: offer.dailyWon,
    finishTutorial: () => tour.saveStep('TUTORIAL_DONE'),
    cardTour:
      view === 'card' &&
      (tour.screen === 'flip_card' || tour.screen === 'free_expression')
        ? {
            screen: tour.screen,
            onFlipped: () => tour.saveStep('CARD_FLIPPED'),
            // 줄 표현이 없거나 넘겼으면 페이월로 몰지 않고 조용히 끝낸다
            onTourEnd: () => tour.saveStep('COMPLETED'),
          }
        : undefined,
  };
};
