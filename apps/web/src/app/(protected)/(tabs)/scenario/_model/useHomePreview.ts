// 홈의 프리미엄 프리뷰 지휘 — 튜토리얼과 카드 뒤집기·무료 표현을 차례로 낸다
'use client';

import { useEffect } from 'react';
import { EVENTS, type PreviewEndReason } from '@landit/analytics';

// 가로 import 사유: 프리뷰 끝에 이어지는 환급 페이월의 첫 화면 그림을 미리 받는다
import { SCENARIO_WALL_IMAGES } from '@/app/(protected)/paywall/_model/paywall-content';
import { track } from '@/shared/analytics';
import { preloadImages } from '@/shared/lib/preload-next-images';

import { usePremiumPreview } from '../../../_model/usePremiumPreview';
import { useRewardOffer } from '../../../_model/useRewardOffer';
import {
  homePreviewViewOf,
  previewHoldsSatisfaction,
} from './home-preview-view';

/**
 * @param cleared 오늘 카드를 끝냈는가
 * @param showerHold 돌아온 순간의 동전 연출이 아직 도는가
 */
export const useHomePreview = ({
  cleared,
  showerHold,
}: {
  cleared: boolean;
  showerHold: boolean;
}) => {
  const premiumPreview = usePremiumPreview();
  const view = homePreviewViewOf({
    screen: premiumPreview.screen,
    cleared,
    showerHold,
  });
  // 가격은 프리뷰가 있는 동안 미리 받는다 — 튜토리얼이 뜨기 전에 받아 두어야 금액이 등록가로 굳지 않는다
  const offer = useRewardOffer({ enabled: premiumPreview.screen !== 'none' });
  // 무료 표현을 마치면 환급 페이월로 간다 — 그 차례가 오면 페이월 첫 화면의 카드 벽 그림을 미리 받는다
  useEffect(() => {
    if (premiumPreview.screen === 'free_expression')
      preloadImages(SCENARIO_WALL_IMAGES);
  }, [premiumPreview.screen]);

  return {
    view,
    // 프리뷰가 화면에 있거나 대상인지 아직 모르면 홈의 다른 시트(소감·알림 동의)는 미룬다
    active: premiumPreview.deciding || view !== 'none',
    holdsSatisfaction: previewHoldsSatisfaction({
      deciding: premiumPreview.deciding,
      step: premiumPreview.step,
    }),
    dailyWon: offer.dailyWon,
    finishTutorial: () => premiumPreview.saveStep('TUTORIAL_DONE'),
    cardPreview:
      view === 'card' &&
      (premiumPreview.screen === 'flip_card' ||
        premiumPreview.screen === 'free_expression')
        ? {
            screen: premiumPreview.screen,
            onFlipped: () => premiumPreview.saveStep('CARD_FLIPPED'),
            onFreeOpened: () => premiumPreview.saveStep('FREE_OPENED'),
            // 줄 표현이 없거나 넘겼으면 페이월로 몰지 않고 조용히 끝낸다
            onPreviewEnd: (reason: PreviewEndReason) => {
              track(EVENTS.PREMIUM_PREVIEW_ENDED, { reason });
              premiumPreview.saveStep('COMPLETED');
            },
          }
        : undefined,
  };
};
