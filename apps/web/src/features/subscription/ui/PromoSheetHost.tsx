'use client';

// 할인 시트를 스토어 가격과 함께 띄운다 — 가격표를 이미 들고 있지 않은 자리(헤더 배지)가 쓴다.
// 배지가 보이는 동안 매달아 두면 가격을 미리 받아 두게 돼, 눌렀을 때 기다리지 않는다
import { useEffect } from 'react';

import { showToast } from '@/shared/ui/toast';

import type { PaywallPromo } from '../api/subscription';
import { setPromoSheetOpen } from '../model/promo-handoff';
import { canShowPromo } from '../model/promo-sheet';
import { useOfferings } from '../model/useOfferings';
import { PromoSheet } from './PromoSheet';

interface PromoSheetHostProps {
  /** 시트를 펼칠지. 닫혀 있어도 붙어 있으면서 스토어 가격을 미리 받아 둔다 */
  open: boolean;
  promo: PaywallPromo;
  expired: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}

/**
 * 가격표를 들고 있지 않은 자리에서 할인 시트를 띄운다.
 *
 * 스토어 오퍼링이 닿기 전에는 시트를 그릴 수 없으므로, 그동안에도 자리를 맡아
 * 소감·알림 시트가 먼저 떠 버리지 않게 한다. 9초까지 못 받으면 못 연다고 알리고 되돌린다.
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

  // 열라는 말을 들은 순간부터 자리를 맡는다 — 가격을 기다리는 동안 소감·알림 시트가 먼저 떠 버리면 겹친다
  useEffect(() => {
    if (!open) return;
    setPromoSheetOpen(true);
    return () => setPromoSheetOpen(false);
  }, [open]);

  // 펼치라는데 할인 가격표가 없으면 죽은 버튼이 된다 — 못 연다고 알리고 되돌린다
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
