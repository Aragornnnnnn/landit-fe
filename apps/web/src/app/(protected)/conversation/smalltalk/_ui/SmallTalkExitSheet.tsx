// 스몰톡 나가기 확인 — X로 튕겨 나가는 대신 "직접 끝내보라"고 한 번 권한다.
// 작별 인사를 하면 상대가 알아채고 대화를 마무리해 주는데, 그 길을 모르면 X로만 나가게 된다
'use client';

import Image from 'next/image';

import { ConfirmSheet } from '@/shared/ui/ConfirmSheet';

interface SmallTalkExitSheetProps {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const SmallTalkExitSheet = ({
  open,
  onConfirm,
  onClose,
}: SmallTalkExitSheetProps) => (
  <ConfirmSheet
    open={open}
    title="대화를 그만할까요?"
    description="지금 나가면 이 대화는 기록에 남지 않아요."
    confirmLabel="나가기"
    continueLabel="계속하기"
    onConfirm={onConfirm}
    onClose={onClose}
    top={
      <Image
        src="/images/character/landy-crying.webp"
        alt=""
        width={96}
        height={96}
        className="size-24"
      />
    }
    extra={
      <div className="rounded-2xl bg-muted px-4 py-3 text-left">
        <p className="text-[13px] font-semibold text-muted-foreground">
          직접 끝내볼래요?
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">
          “I should get going. Talk to you later!”
        </p>
      </div>
    }
  />
);
