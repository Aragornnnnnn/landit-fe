'use client';

// 표현 학습 중단 확인 바텀시트 — 예문까지 스텝에서 X로 나갈 때. 우는 랜디로 이탈을 한 번 붙잡는다
import Image from 'next/image';

import { ConfirmSheet } from '@/shared/ui/ConfirmSheet';

interface ExpressionExitSheetProps {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ExpressionExitSheet = ({
  open,
  onConfirm,
  onClose,
}: ExpressionExitSheetProps) => (
  <ConfirmSheet
    open={open}
    title="학습을 중단할까요?"
    description="지금 나가면 이 표현은 완료되지 않아요."
    confirmLabel="나가기"
    continueLabel="계속 학습하기"
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
  />
);
