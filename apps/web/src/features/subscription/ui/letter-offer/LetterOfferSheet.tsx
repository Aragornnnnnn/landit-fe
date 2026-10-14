'use client';

// 편지 혜택가 시트 — 이탈 할인 시트와 같은 모양에서 남은 시간과 월간을 뺀, 할인 연간 카드 한 장과 결제 CTA
import { EVENTS } from '@landit/analytics';
import Link from 'next/link';

import { track } from '@/shared/analytics';
import { useAuthStore } from '@/shared/auth/auth-store';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { CloseIcon } from '@/shared/ui/Icons';

import { formatWon } from '../../lib/won';
import type { LetterOffer } from '../../model/letter-offer/letter-offer';
import { usePurchase } from '../../model/purchase/usePurchase';
import { PromoGlow } from '../exit-promo/PromoGlow';
import { GOLD_GRADIENT, PremiumPill } from '../premium-brand';

interface LetterOfferSheetProps {
  open: boolean;
  offer: LetterOffer;
  onClose: () => void;
  onUnlocked: () => void;
}

export const LetterOfferSheet = ({
  open,
  offer,
  onClose,
  onUnlocked,
}: LetterOfferSheetProps) => {
  // 한 사람에게 보내는 편지라 제목에서 이름을 부른다
  const name = useAuthStore(
    (state) => state.member?.nickname?.trim() || '회원',
  );
  // 할인 결제로 남긴다 — 정가 결제와 섞이지 않게
  const { busy, purchase } = usePurchase({
    packages: offer.packages,
    onUnlocked,
    promo: true,
  });

  // 결제가 진행 중이면 닫지 않는다 — 닫으면 스토어 결제 결과를 받을 화면이 사라진다
  const closeIfIdle = () => {
    if (!busy) onClose();
  };

  const startPurchase = () => {
    track(EVENTS.PURCHASE_STARTED, { plan: 'yearly', promo: true });
    void purchase('yearly');
  };

  return (
    <BottomSheet open={open} onClose={closeIfIdle}>
      <PromoGlow />

      <button
        type="button"
        aria-label="닫기"
        onClick={closeIfIdle}
        className="absolute top-4 right-4 text-muted-foreground"
      >
        <CloseIcon size={24} />
      </button>

      <header className="relative flex flex-col items-center text-center">
        <PremiumPill />
        <h2 className="mt-2.5 text-[26px] leading-[1.3] font-bold text-foreground">
          {name}님께만 드리는
          <br />
          프리미엄 혜택가
        </h2>
        <p className="mt-2 text-[15px] leading-[1.4] text-muted-foreground">
          찾아 주셔서 고마운 마음을 담았어요
        </p>
      </header>

      <section className="relative mt-5">
        <div className="relative flex items-center justify-between rounded-2xl border-2 border-primary bg-[#fffcf8] px-4 py-4">
          <span
            className="absolute -top-2.5 right-4 rounded-full px-2.5 py-[3px] text-[11px] leading-[1.3] font-bold text-[#4a2f00]"
            style={{ background: GOLD_GRADIENT }}
          >
            {offer.discountRate ? `${offer.discountRate}% 혜택가` : '혜택가'}
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-[17px] leading-[1.3] font-bold text-foreground">
              연간 플랜
            </span>
            <span className="text-[12px] leading-[1.3] text-primary">
              7일 무료 체험 포함
            </span>
          </span>
          <span className="flex flex-col items-end gap-0.5">
            <span className="flex items-baseline gap-1.5">
              {offer.listPrice && (
                <span className="text-[12px] leading-[1.3] text-[#9ca3af] line-through">
                  {formatWon(offer.listPrice)}
                </span>
              )}
              {/* 큰 숫자는 실제 청구액 — 월 환산가가 더 눈에 띄면 스토어 심사 3.1.2(c)에서 반려된다 */}
              <span className="text-[19px] leading-[1.3] font-bold text-foreground">
                {formatWon(offer.price)}
                <span className="text-[15px]"> /년</span>
              </span>
            </span>
            <span className="text-[12px] leading-[1.3] text-muted-foreground">
              월 {formatWon(offer.monthlyPrice)}꼴
            </span>
          </span>
        </div>
      </section>

      <footer className="relative mt-6">
        <Button
          size="md"
          className="text-base font-bold"
          onClick={startPurchase}
          loading={busy}
        >
          프리미엄 시작하기
        </Button>
        {/* 청구액·갱신·해지는 스토어 심사(3.1.2)가 결제 버튼 곁에서 확인한다 — 페이월 연간과 같은 문구 */}
        <p className="mt-3 text-center text-[11px] leading-[1.35] text-muted-foreground">
          7일 무료 체험 후 연 {formatWon(offer.price)} 정기 결제 · 언제든 해지
          가능
        </p>
        <nav className="mt-2 flex justify-center gap-3 text-[10px] leading-[1.3] font-medium text-muted-foreground underline">
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy">개인정보 처리방침</Link>
        </nav>
      </footer>
    </BottomSheet>
  );
};
