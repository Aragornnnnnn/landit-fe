'use client';

// 탭 칩 — 고를 게 둘 이상일 때만 그린다. 탭이 하나면 선택이라는 행위 자체가 없다
import { EVENTS } from '@landit/analytics';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { track } from '@/shared/analytics';
import { TAB_CHIP_ROW, tabChipClass } from '@/shared/ui/tab-chip';

import type { Tab } from './tabs';

export const TabBar = ({ tabs }: { tabs: Tab[] }) => {
  const pathname = usePathname();

  if (tabs.length < 2) return null;

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
            // 보고 있는 탭을 다시 누르는 건 전환이 아니다
            onClick={() => {
              if (!isActive) track(EVENTS.HOME_TAB_SWITCHED, { tab: tab.id });
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};
