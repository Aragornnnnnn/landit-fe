'use client';

// 할인 시트를 스토어 가격과 함께 띄운다 — 가격표를 이미 들고 있지 않은 자리(헤더 배지)가 쓴다.
// 이 컴포넌트가 붙는 순간 오퍼링을 묻기 때문에, 시트를 열 때만 매달아야 왕복이 낭비되지 않는다
import type { PaywallPromo } from '../api/subscription';
import { useOfferings } from '../model/useOfferings';
import { PromoSheet } from './PromoSheet';

interface PromoSheetHostProps {
  promo: PaywallPromo;
  expired: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}

export const PromoSheetHost = ({
  promo,
  expired,
  onClose,
  onUnlocked,
}: PromoSheetHostProps) => {
  const tiers = useOfferings();

  return (
    <PromoSheet
      open
      promo={promo}
      expired={expired}
      tiers={tiers}
      onClose={onClose}
      onUnlocked={onUnlocked}
    />
  );
};
