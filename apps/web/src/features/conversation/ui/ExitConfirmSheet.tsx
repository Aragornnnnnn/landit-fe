// 대화 종료 확인 바텀시트 — 뒤로가기 시 바로 나가지 않고 진행 중인 대화가 사라짐을 알린다
'use client';

import { ConfirmSheet } from '@/shared/ui/ConfirmSheet';

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
  <ConfirmSheet
    open={open}
    title="대화를 종료할까요?"
    description="지금 나가면 진행 중인 대화가 저장되지 않아요."
    confirmLabel="나가기"
    continueLabel="계속하기"
    onConfirm={onConfirm}
    onClose={onClose}
  />
);
