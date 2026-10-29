// 대화 종료 확인 바텀시트 — 뒤로가기 시 바로 나가지 않고 진행 중인 대화가 사라짐을 알린다. 우는 랜디로 이탈을 한 번 붙잡는다
'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

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
}: ExitConfirmSheetProps) => {
  const t = useTranslations('conversation.exitConfirmSheet');
  return (
    <ConfirmSheet
      open={open}
      title={t('title')}
      description={t('description')}
      confirmLabel={t('confirmButton')}
      continueLabel={t('continueButton')}
      onConfirm={onConfirm}
      onClose={onClose}
      top={
        <Image
          src="/images/character/landy-crying.webp"
          alt=""
          width={96}
          height={96}
          className="size-24"
        />
      }
    />
  );
};
