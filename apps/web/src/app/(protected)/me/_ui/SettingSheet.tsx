// 마이페이지 설정 시트 한 벌 — 제목·한 줄 설명·내용·닫기. 진동·음성·대화 설정이 같은 모양으로 열린다
import type { ReactNode } from 'react';

import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

interface SettingSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  // 제목 오른쪽 보조 동작(들어보기 같은 것)
  action?: ReactNode;
  children: ReactNode;
}

export const SettingSheet = ({
  open,
  onClose,
  title,
  description,
  action,
  children,
}: SettingSheetProps) => (
  <BottomSheet open={open} onClose={onClose}>
    <div className="flex items-center justify-between">
      <BottomSheet.Title
        className="text-[17px] font-bold"
        style={{ color: '#111' }}
      >
        {title}
      </BottomSheet.Title>
      {action}
    </div>
    <p className="mt-1 mb-4 text-[14px] leading-6" style={{ color: '#666' }}>
      {description}
    </p>
    {children}
    <div className="mt-5">
      <Button
        type="button"
        variant="ghost"
        size="md"
        className="w-full"
        onClick={onClose}
      >
        닫기
      </Button>
    </div>
  </BottomSheet>
);
