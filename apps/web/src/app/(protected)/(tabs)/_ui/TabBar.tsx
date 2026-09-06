'use client';

// 탭 칩 — 고를 게 둘 이상일 때만 그린다. 탭이 하나면 선택이라는 행위 자체가 없다
import { EVENTS } from '@landit/analytics';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { track } from '@/shared/analytics';
import { useSeenFlag } from '@/shared/lib/useSeenFlag';
import { TAB_CHIP_ROW, tabChipClass } from '@/shared/ui/tab-chip';

import { tapGreetingSeen } from '../_model/tap-greeting-seen';
import type { Tab } from './tabs';

export const TabBar = ({ tabs }: { tabs: Tab[] }) => {
  const pathname = usePathname();
  // 스몰톡은 캐릭터를 눌러야 인사가 시작된다 — 아직 안 들어 본 사람에게만 점 하나로 눈짓한다
  const greetingSeen = useSeenFlag(tapGreetingSeen);

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
            className={`relative inline-flex items-center ${tabChipClass(isActive)}`}
            // 보고 있는 탭을 다시 누르는 건 전환이 아니다
            onClick={() => {
              if (!isActive) track(EVENTS.HOME_TAB_SWITCHED, { tab: tab.id });
            }}
          >
            {tab.label}
            {tab.id === 'smalltalk' && !greetingSeen && (
              // 점은 읽어 주지 않는다 — 탭에 들어가면 코치마크가 같은 말을 접근성까지 갖춰 다시 한다.
              // 알약 오른쪽 위 모서리에 걸쳐 둔다 — 흐름에서 빠져 있어 점이 붙고 빠져도 칩 너비가 그대로다
              <span
                aria-hidden
                data-testid="smalltalk-greeting-dot"
                className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-primary"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
};
