'use client';

// 시나리오 카테고리 선택 바 — 가로 스크롤 칩, 잠긴 카테고리는 자물쇠 표시
import type { ScenarioCategory } from '@/api/scenarios/list';
import { LockIcon } from '@/components/ui/Icons';

interface CategoryBarProps {
  categories: ScenarioCategory[];
  selectedId: number;
  onSelect: (category: ScenarioCategory) => void;
}

export const CategoryBar = ({
  categories,
  selectedId,
  onSelect,
}: CategoryBarProps) => (
  <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-border bg-background px-5 py-2.5">
    {categories.map((category) => {
      const isSelected = category.categoryId === selectedId;

      return (
        <button
          key={category.categoryId}
          type="button"
          onClick={() => onSelect(category)}
          disabled={category.categoryLocked}
          className={[
            'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
            isSelected
              ? 'bg-foreground text-background'
              : 'bg-secondary text-secondary-foreground',
            category.categoryLocked ? 'text-muted-foreground opacity-60' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {category.categoryLocked && <LockIcon size={13} />}
          {category.categoryName}
        </button>
      );
    })}
  </div>
);
