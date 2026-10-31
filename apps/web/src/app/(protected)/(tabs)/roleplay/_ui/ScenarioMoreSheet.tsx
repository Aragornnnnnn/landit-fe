// 카드 ⋯ 시트 — 지난 대화 보기 · 삭제하기. 한 번도 대화하지 않은 시나리오는 지난 대화 보기를 흐리게 막는다
import { useTranslations } from 'next-intl';

import type { RoleplayScenario } from '@/features/roleplay/api/roleplay';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { HistoryIcon, TrashIcon } from '@/shared/ui/Icons';

interface ScenarioMoreSheetProps {
  // 시트를 연 카드. null이면 닫혀 있다
  scenario: RoleplayScenario | null;
  onHistory: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const ROW_CLASS =
  'flex h-13 w-full items-center gap-3 text-base font-medium active:opacity-60 disabled:opacity-35';

export const ScenarioMoreSheet = ({
  scenario,
  onHistory,
  onDelete,
  onClose,
}: ScenarioMoreSheetProps) => {
  const t = useTranslations('roleplay.more');

  return (
    <BottomSheet open={scenario !== null} onClose={onClose}>
      <BottomSheet.Title className="truncate text-center text-15 font-bold text-muted-foreground">
        {scenario?.title}
      </BottomSheet.Title>
      <div className="mt-3 flex flex-col">
        <button
          type="button"
          onClick={onHistory}
          disabled={scenario?.sessionCount === 0}
          className={`${ROW_CLASS} text-foreground`}
        >
          <HistoryIcon size={20} />
          {t('historyButton')}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className={`${ROW_CLASS} text-destructive`}
        >
          <TrashIcon size={20} />
          {t('deleteButton')}
        </button>
      </div>
      <Button variant="ghost" size="md" className="mt-4" onClick={onClose}>
        {t('closeButton')}
      </Button>
    </BottomSheet>
  );
};
