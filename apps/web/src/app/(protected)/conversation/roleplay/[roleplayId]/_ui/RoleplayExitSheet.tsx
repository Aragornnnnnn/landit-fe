// 롤플레이 끝내기 확인 — 롤플레이는 작별 인사로 끝나지 않아 X가 곧 정상 종료다.
// 그래서 붙잡지 않고 "여기까지 하고 피드백 볼지"만 묻는다. 끝내는 쪽이 큰 버튼, 계속하기는 글자 버튼이다
'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

import { lineBreak } from '@/shared/i18n/rich';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

interface RoleplayExitSheetProps {
  open: boolean;
  // 완료 요청을 기다리는 중 — 두 버튼을 막는다
  completing: boolean;
  onComplete: () => void;
  onClose: () => void;
}

export const RoleplayExitSheet = ({
  open,
  completing,
  onComplete,
  onClose,
}: RoleplayExitSheetProps) => {
  const t = useTranslations('conversation.roleplayExitSheet');
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <Image
          src="/images/character/landy-wave.webp"
          alt=""
          width={120}
          height={120}
          className="size-30"
        />
        <BottomSheet.Title className="mt-2 text-xl font-bold break-keep text-foreground">
          {t('title')}
        </BottomSheet.Title>
        <p className="mt-2 text-15 leading-6 break-keep text-muted-foreground">
          {t.rich('description', lineBreak)}
        </p>
      </div>
      <Button className="mt-6" loading={completing} onClick={onComplete}>
        {t('completeButton')}
      </Button>
      <button
        type="button"
        disabled={completing}
        onClick={onClose}
        className="mt-2 h-12 w-full text-15 font-medium text-muted-foreground active:opacity-70 disabled:opacity-45"
      >
        {t('continueButton')}
      </button>
    </BottomSheet>
  );
};
