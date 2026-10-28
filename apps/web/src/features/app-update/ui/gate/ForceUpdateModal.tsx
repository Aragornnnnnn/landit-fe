// 강제 업데이트 모달 — 닫을 수 없고, 스토어로 이동하는 버튼만 제공한다
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

import { goToStore } from '../../model/goToStore';

interface ForceUpdateModalProps {
  reason: string | null;
}

export const ForceUpdateModal = ({ reason }: ForceUpdateModalProps) => {
  const t = useTranslations('appUpdate.forceUpdate');
  return (
    <Modal open onClose={() => {}} dismissible={false} label={t('title')}>
      <div className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/character/landy-fighting.webp"
          alt={t('mascotLabel')}
          className="object-contain"
          style={{ width: 120, height: 120 }}
        />
        <h2 className="mt-4 text-lg font-bold text-foreground">{t('title')}</h2>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {reason?.trim() || t('defaultReasonBody')}
        </p>
      </div>
      <Button className="mt-5" onClick={goToStore}>
        {t('updateButton')}
      </Button>
    </Modal>
  );
};
