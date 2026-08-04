// 알림 동의 바텀시트 — 풀스크린 프롬프트를 이미 본 유저에게 실행마다 가볍게 다시 청한다 (피그마 08-B)
'use client';

import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

import { LockScreenMockup } from './LockScreenMockup';

export const NotificationConsentSheet = ({
  onAccept,
  onDismiss,
}: {
  onAccept: () => void;
  onDismiss: () => void;
}) => (
  <BottomSheet open onClose={onDismiss}>
    <LockScreenMockup />
    <h2 className="mt-5 text-center text-lg font-bold text-foreground">
      알림으로 도와드릴게요
    </h2>
    <p className="mt-1 text-center text-sm leading-6 text-muted-foreground">
      오늘의 대화를 잊고 있다면 알려드려요
    </p>
    <Button className="mt-5" onClick={onAccept}>
      알림 받을게요!
    </Button>
    <button
      type="button"
      className="mt-4 w-full text-center text-sm font-semibold text-muted-foreground"
      onClick={onDismiss}
    >
      다음에 할게요
    </button>
  </BottomSheet>
);
