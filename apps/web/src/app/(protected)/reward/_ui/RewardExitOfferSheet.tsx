'use client';

// 결제 전 환급 화면에서 나가려 할 때 뜨는 신규 회원 특가 시트 — 정가를 지운 반값과, 꾸준히 하면 그것도 돌려받는다는 한 줄로 붙잡는다
import type { RewardOffer } from '@/features/reward/model/refund-offer';
import { Coin } from '@/features/reward/ui/common/Coin';
import {
  discountPercentOf,
  listPriceOf,
} from '@/features/subscription/model/product/pass-price';
import { formatWon } from '@/shared/lib/won';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

export const RewardExitOfferSheet = ({
  open,
  offer,
  onStart,
  onLeave,
  onClose,
}: {
  open: boolean;
  offer: RewardOffer;
  // 「신규 특가로 시작하기」 — 결제 금액 안내로 간다
  onStart: () => void;
  // 「혜택 포기하기」 — 원래 하려던 대로 나간다
  onLeave: () => void;
  // 바깥을 눌러 시트만 닫는다 — 환급 화면에 그대로 남는다
  onClose: () => void;
}) => {
  const listPrice = listPriceOf(offer.priceWon);

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <span className="rounded-md bg-destructive px-2 py-0.5 text-[12px] font-bold text-white">
          신규 회원 특가
        </span>
        <BottomSheet.Title className="mt-3 text-[22px] leading-[31px] font-black tracking-[-0.025em] whitespace-pre-line text-foreground">
          {'잠깐! 지금 시작하면\n프리미엄이 사실상 '}
          <span className="text-primary">0원</span>이에요
        </BottomSheet.Title>
      </div>

      <div className="mt-5 rounded-[20px] border-2 border-primary bg-[#fffcf8] px-4 py-3.5 text-left">
        <p className="text-[15px] font-bold text-[#c4601f]">
          {offer.days}일 프리미엄 이용권
        </p>
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="text-[13px] font-medium text-[#b1aaa3] line-through">
            {formatWon(listPrice)}
          </span>
          <span className="text-lg font-black text-primary">
            {discountPercentOf(offer.priceWon, listPrice)}%
          </span>
          <span className="text-[22px] font-black text-foreground tabular-nums">
            {formatWon(offer.priceWon)}
          </span>
        </p>
        <p className="mt-2 flex items-center gap-1.5 border-t border-[#f1ebe3] pt-2 text-[13px] font-medium text-[#5f5953]">
          <Coin size={18} />
          꾸준히 하면 결제한 {formatWon(offer.priceWon)}도 돌려받아요
        </p>
      </div>

      <div className="mt-5 flex flex-col items-center gap-1">
        <Button onClick={onStart}>신규 특가로 시작하기</Button>
        <button
          type="button"
          onClick={onLeave}
          className="px-4 py-3 text-[15px] font-medium text-muted-foreground"
        >
          혜택 포기하기
        </button>
      </div>
    </BottomSheet>
  );
};
