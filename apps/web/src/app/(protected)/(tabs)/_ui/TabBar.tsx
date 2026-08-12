'use client';

// 탭 칩 — 고를 게 둘 이상일 때만 그린다. 탭이 하나면 선택이라는 행위 자체가 없다.
// 보고 있는 탭에 곁길(action)이 있으면 같은 줄 오른쪽 끝에 붙인다 — 탭 내용이 아니라 부가 목적지다
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ChevronRightIcon } from '@/shared/ui/Icons';
import { TAB_CHIP_ROW, tabChipClass } from '@/shared/ui/tab-chip';

import type { Tab } from './tabs';

export const TabBar = ({ tabs }: { tabs: Tab[] }) => {
  const pathname = usePathname();

  if (tabs.length < 2) return null;

  const action = tabs.find((tab) => tab.href === pathname)?.action;

  return (
    <nav aria-label="탭" className={TAB_CHIP_ROW}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={tabChipClass(isActive)}
          >
            {tab.label}
          </Link>
        );
      })}

      {action && (
        <Link
          href={action.href}
          className="ml-auto flex shrink-0 items-center gap-0.5 text-xs font-semibold text-muted-foreground"
        >
          {action.label}
          <ChevronRightIcon size={14} />
        </Link>
      )}
    </nav>
  );
};
