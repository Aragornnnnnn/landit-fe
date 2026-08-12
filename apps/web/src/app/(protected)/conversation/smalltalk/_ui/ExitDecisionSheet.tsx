// 종료 의사 확인 — 상대가 내 작별 인사를 알아챘을 때 뜬다.
// 서버는 답을 받을 때까지 대화를 멈춰 두므로, 시트를 닫는 것도 "더 얘기하기"라는 답으로 보낸다
'use client';

import { ConfirmSheet } from '@/shared/ui/ConfirmSheet';

interface ExitDecisionSheetProps {
  open: boolean;
  onEnd: () => void;
  onContinue: () => void;
}

export const ExitDecisionSheet = ({
  open,
  onEnd,
  onContinue,
}: ExitDecisionSheetProps) => (
  <ConfirmSheet
    open={open}
    title="오늘 대화를 마칠까요?"
    description="마치면 방금 나눈 얘기로 맞춤 표현을 만들어 드려요."
    confirmLabel="마칠래요"
    continueLabel="더 얘기할래요"
    onConfirm={onEnd}
    onClose={onContinue}
  />
);
