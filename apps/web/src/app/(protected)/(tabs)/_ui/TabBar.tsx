'use client';

// 탭 칩 — 고를 게 둘 이상일 때만 그린다. 탭이 하나면 선택이라는 행위 자체가 없다
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { Tab } from './tabs';

export const TabBar = ({ tabs }: { tabs: Tab[] }) => {
  const pathname = usePathname();

  if (tabs.length < 2) return null;

  return (
    <nav
      aria-label="탭"
      className="flex shrink-0 gap-2 bg-background px-5 pt-1 pb-2.5"
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-foreground text-background'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};
