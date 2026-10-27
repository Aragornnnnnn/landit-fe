// 알림 동의 바텀시트 — 풀스크린 프롬프트를 이미 본 유저에게 실행마다 가볍게 다시 청한다 (피그마 08-B)
'use client';

import { useTranslations } from 'next-intl';

import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

import { LockScreenMockup } from './LockScreenMockup';

export const NotificationConsentSheet = ({
  onAccept,
  onDismiss,
}: {
  onAccept: () => void;
  onDismiss: () => void;
}) => {
  const t = useTranslations('notification.consentSheet');
  return (
    <BottomSheet open onClose={onDismiss}>
      <LockScreenMockup />
      <BottomSheet.Title className="mt-5 text-center text-lg font-bold text-foreground">
        {t('title')}
      </BottomSheet.Title>
      <p className="mt-1 text-center text-sm leading-6 text-muted-foreground">
        {t('subtitle')}
      </p>
      <Button className="mt-5" onClick={onAccept}>
        {t('acceptButton')}
      </Button>
      <button
        type="button"
        className="mt-4 w-full text-center text-sm font-semibold text-muted-foreground"
        onClick={onDismiss}
      >
        {t('laterButton')}
      </button>
    </BottomSheet>
  );
};
