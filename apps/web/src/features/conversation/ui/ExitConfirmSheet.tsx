// 대화 종료 확인 바텀시트 — 뒤로가기 시 바로 나가지 않고 진행 중인 대화가 사라짐을 알린다
'use client';

import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

interface ExitConfirmSheetProps {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ExitConfirmSheet = ({
  open,
  onConfirm,
  onClose,
}: ExitConfirmSheetProps) => (
  <BottomSheet open={open} onClose={onClose}>
    <h2 className="text-[17px] font-bold text-foreground">
      대화를 종료할까요?
    </h2>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">
      지금 나가면 진행 중인 대화가 저장되지 않아요.
    </p>
    <div className="mt-5 grid grid-cols-2 gap-2">
      <Button variant="ghost" size="md" onClick={onConfirm}>
        나가기
      </Button>
      <Button size="md" onClick={onClose}>
        계속하기
      </Button>
    </div>
  </BottomSheet>
);
