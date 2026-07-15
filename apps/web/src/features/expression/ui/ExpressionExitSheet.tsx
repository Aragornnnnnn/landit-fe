'use client';

// 표현 학습 중단 확인 바텀시트 — 예문까지 스텝에서 X로 나갈 때. 우는 랜디로 이탈을 한 번 붙잡는다
import Image from 'next/image';

import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

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
  <BottomSheet open={open} onClose={onClose}>
    <div className="flex flex-col items-center text-center">
      <Image
        src="/images/character/landy-crying.webp"
        alt=""
        width={96}
        height={96}
        className="size-24"
      />
      <h2 className="mt-1 text-[17px] font-bold text-foreground">
        학습을 중단할까요?
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        지금 나가면 이 표현은 완료되지 않아요.
      </p>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-2">
      <Button variant="ghost" size="md" onClick={onConfirm}>
        나가기
      </Button>
      <Button size="md" onClick={onClose}>
        계속 학습하기
      </Button>
    </div>
  </BottomSheet>
);
