'use client';

// 헤더 배지에서 할인 시트를 열 때 거치는 껍데기 — 스토어 가격을 직접 받아 시트에 넘긴다.
// 배지가 떠 있는 동안 계속 붙어 있어서, 누르기 전에 가격을 미리 받아 둔다
import { useEffect } from 'react';

import { showToast } from '@/shared/ui/toast';

import type { PaywallPromo } from '../api/subscription';
import { setPromoSheetOpen } from '../model/promo-handoff';
import { canShowPromo } from '../model/promo-sheet';
import { useOfferings } from '../model/useOfferings';
import { PromoSheet } from './PromoSheet';

interface PromoSheetHostProps {
  /** 시트를 펼칠지. false여도 이 컴포넌트는 붙어 있으면서 스토어 가격을 미리 받아 둔다 */
  open: boolean;
  promo: PaywallPromo;
  expired: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}

/**
 * 스토어 가격을 받아 할인 시트에 넘긴다.
 *
 * 페이월은 가격을 이미 들고 있어 `PromoSheet`를 바로 그리지만, 헤더 배지는 없어서 이걸 거친다.
 * 가격이 오기 전에는 시트를 그릴 수 없으므로, 그동안 소감·알림 동의 시트가 대신 떠 버리지 않게
 * `setPromoSheetOpen(true)`를 먼저 호출해 둔다. 9초 안에 못 받으면 토스트를 띄우고 닫는다.
 */
export const PromoSheetHost = ({
  open,
  promo,
  expired,
  onClose,
  onUnlocked,
}: PromoSheetHostProps) => {
  const tiers = useOfferings();
  const ready = canShowPromo(tiers);

  // open이 켜지는 즉시 알린다 — 가격을 기다리는 동안 소감·알림 동의 시트가 먼저 떠 버리면 겹친다
  useEffect(() => {
    if (!open) return;
    setPromoSheetOpen(true);
    return () => setPromoSheetOpen(false);
  }, [open]);

  // 9초가 지나도 가격이 없으면 배지가 눌리지 않는 버튼처럼 보인다 — 못 연다고 알리고 닫는다
  useEffect(() => {
    if (!open || ready) return;
    const timer = setTimeout(() => {
      showToast('지금은 할인을 열 수 없어요');
      onClose();
    }, OPEN_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [open, ready, onClose]);

  if (!open || !ready) return null;

  return (
    <PromoSheet
      promo={promo}
      expired={expired}
      tiers={tiers}
      onClose={onClose}
      onUnlocked={onUnlocked}
    />
  );
};

// 셸 오퍼링 왕복이 8초까지 걸린다. 그보다 조금 더 기다렸다 포기한다
const OPEN_TIMEOUT_MS = 9000;
