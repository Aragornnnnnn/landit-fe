'use client';

// 공통 확인 바텀시트 — 제목·설명 + [확인(ghost) / 계속(primary)] 2버튼 구성 (나가기·종료류 확인에 공용)
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

interface ConfirmSheetProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string; // 왼쪽 ghost — 나가기/종료 등 이탈 동작
  continueLabel: string; // 오른쪽 primary — 계속하기
  onConfirm: () => void;
  onClose: () => void;
  // 타이틀 위 슬롯(일러스트 등) — 있으면 가운데 정렬로 그린다
  top?: React.ReactNode;
}

export const ConfirmSheet = ({
  open,
  title,
  description,
  confirmLabel,
  continueLabel,
  onConfirm,
  onClose,
  top,
}: ConfirmSheetProps) => (
  <BottomSheet open={open} onClose={onClose}>
    <div className={top ? 'flex flex-col items-center text-center' : undefined}>
      {top}
      <h2
        className={`text-[17px] font-bold text-foreground ${top ? 'mt-1' : ''}`}
      >
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-2">
      <Button variant="ghost" size="md" onClick={onConfirm}>
        {confirmLabel}
      </Button>
      <Button size="md" onClick={onClose}>
        {continueLabel}
      </Button>
    </div>
  </BottomSheet>
);
