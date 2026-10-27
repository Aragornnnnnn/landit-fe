'use client';

// 표현 학습 중단 확인 바텀시트 — 예문까지 스텝에서 X로 나갈 때. 우는 랜디로 이탈을 한 번 붙잡는다
import { useTranslations } from 'next-intl';
import Image from 'next/image';

import { ConfirmSheet } from '@/shared/ui/ConfirmSheet';

interface ExpressionExitSheetProps {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ExpressionExitSheet = ({
  open,
  onConfirm,
  onClose,
}: ExpressionExitSheetProps) => {
  const t = useTranslations('expression.exitSheet');
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
