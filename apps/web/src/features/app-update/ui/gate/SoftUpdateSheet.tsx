// 소프트 업데이트 시트 — 닫을 수 있고, 명시적으로 미룰 수 있는 버튼도 제공한다
import { useTranslations } from 'next-intl';

import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

import { goToStore } from '../../model/goToStore';

interface SoftUpdateSheetProps {
  reason: string | null;
  onClose: () => void;
}

export const SoftUpdateSheet = ({ reason, onClose }: SoftUpdateSheetProps) => {
  const t = useTranslations('appUpdate.softUpdate');
  return (
    <BottomSheet open onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/character/landy-fighting.webp"
          alt={t('mascotLabel')}
          className="object-contain"
          style={{ width: 120, height: 120 }}
        />
        <BottomSheet.Title className="mt-4 text-lg font-bold text-foreground">
          {t('title')}
        </BottomSheet.Title>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {reason?.trim() || t('defaultReasonBody')}
        </p>
      </div>
      <Button className="mt-5" onClick={goToStore}>
        {t('updateButton')}
      </Button>
      <button
        type="button"
        className="mt-4 w-full text-center text-sm font-semibold text-foreground"
        onClick={onClose}
      >
        {t('laterButton')}
      </button>
    </BottomSheet>
  );
};
