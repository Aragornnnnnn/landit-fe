// 시나리오 삭제 확인 — 남겨 두기가 왼쪽 고스트, 지우기가 오른쪽 빨간 버튼이다.
// 공용 ConfirmSheet는 오른쪽이 계속하기(주황)라 위험 동작을 오른쪽에 둘 수 없어 따로 그린다
import { useTranslations } from 'next-intl';
import Image from 'next/image';

import type { RoleplayScenario } from '@/features/roleplay/api/roleplay';
import { lineBreak } from '@/shared/i18n/rich';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';

interface DeleteScenarioSheetProps {
  // 지울 시나리오. null이면 닫혀 있다
  scenario: RoleplayScenario | null;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteScenarioSheet = ({
  scenario,
  deleting,
  onConfirm,
  onClose,
}: DeleteScenarioSheetProps) => {
  const t = useTranslations('roleplay.delete');
  const sessionCount = scenario?.sessionCount ?? 0;

  return (
    <BottomSheet open={scenario !== null} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <Image
          src="/images/character/landy-bad.webp"
          alt=""
          width={96}
          height={96}
          className="size-24"
        />
        <BottomSheet.Title className="mt-1 text-17 font-bold break-keep text-foreground">
          {t('title')}
        </BottomSheet.Title>
        <p className="mt-2 text-sm leading-6 break-keep text-muted-foreground">
          {sessionCount > 0
            ? t.rich('description', { ...lineBreak, count: sessionCount })
            : t('emptyDescription')}
        </p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button variant="ghost" size="md" onClick={onClose}>
          {t('keepButton')}
        </Button>
        <Button
          variant="danger"
          size="md"
          loading={deleting}
          onClick={onConfirm}
        >
          {t('confirmButton')}
        </Button>
      </div>
    </BottomSheet>
  );
};
