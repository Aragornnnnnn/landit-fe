'use client';

// 탭 칩 — 고를 게 둘 이상일 때만 그린다. 탭이 하나면 선택이라는 행위 자체가 없다
import { useEffect } from 'react';
import { EVENTS } from '@landit/analytics';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { toSpeakingTimeLabel } from '@/features/small-talk/lib/speaking-time';
// 가로 import 사유: 말풍선이 말하는 무료 한도는 스몰톡 서버 값 그대로다
import { useSmallTalkMainQuery } from '@/features/small-talk/model/useSmallTalkMainQuery';
// 가로 import 사유: 말풍선은 무료 사용자에게만 뜬다 — 같은 게이트 판정을 쓴다
import { usePromoSheetOpen } from '@/features/subscription/model/exit-promo/promo-handoff';
import { usePaywallGate } from '@/features/subscription/model/paywall-gate/usePaywallGate';
import { track } from '@/shared/analytics';
import { useSeenFlag } from '@/shared/lib/useSeenFlag';
import { TAB_CHIP_ROW, tabChipClass } from '@/shared/ui/tab-chip';

import { useEarnShowerHold } from '../_model/useEarnShowerHold';
import {
  freeExpressionFinished,
  smalltalkNudgeSeen,
} from '../../_model/smalltalk-free-nudge';
import { introGuideSeen } from '../smalltalk/_model/intro-guide-seen';
import type { Tab } from './tabs';

export const TabBar = ({ tabs }: { tabs: Tab[] }) => {
  const t = useTranslations('home.tabBar');
  const pathname = usePathname();
  // 스몰톡 첫 안내(무료 5분)를 아직 안 본 사람에게만 점 하나로 눈짓한다 — 안내를 닫으면 사라진다
  const introSeen = useSeenFlag(introGuideSeen);
  const locale = useLocale();
  // 무료 표현을 마친 무료 사용자에겐 스몰톡을 무료로 써 볼 수 있다고 말풍선으로 권한다 — 스몰톡에 들어가 볼 때까지
  const { locked } = usePaywallGate();
  const finished = useSeenFlag(freeExpressionFinished);
  const nudgeSeen = useSeenFlag(smalltalkNudgeSeen);
  const onSmalltalk = tabs.some(
    (tab) => tab.id === 'smalltalk' && tab.href === pathname,
  );
  const nudgeDue = locked && finished && !nudgeSeen;
  // 칩을 눌렀든 마지막 탭으로 들어왔든, 스몰톡 화면을 봤으면 할 말을 한 것이다
  useEffect(() => {
    if (nudgeDue && onSmalltalk) smalltalkNudgeSeen.mark();
  }, [nudgeDue, onSmalltalk]);
  // 한도는 서버 값이다 — 받기 전엔 숫자 없는 말풍선을 띄우지 않고 기다린다
  const { main } = useSmallTalkMainQuery({ enabled: nudgeDue });
  // 페이월을 닫고 돌아온 직후엔 할인 시트나 환급 동전 연출이 먼저다 — 그 위에 말풍선이 같이 뜨면 둘이 겹친다. 끝나면 그때 뜬다
  const promoOpen = usePromoSheetOpen();
  const showerHold = useEarnShowerHold();
  const showsNudge =
    nudgeDue && !onSmalltalk && main !== null && !promoOpen && !showerHold;

  if (tabs.length < 2) return null;

  return (
    <nav aria-label={t('navLabel')} className={TAB_CHIP_ROW}>
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
              // 누른 순간 끈다 — 화면이 바뀌길 기다리면 전환 동안 말풍선이 남는다
              if (tab.id === 'smalltalk' && nudgeDue) smalltalkNudgeSeen.mark();
            }}
          >
            {t(tab.labelKey)}
            {tab.id === 'smalltalk' && showsNudge && (
              // 칩 안에 둬서 말풍선을 눌러도 스몰톡으로 간다. 칩 이름은 그대로 읽히게 접근성 이름에서는 뺀다.
              // 다른 안내 말풍선(헤더 환급·표현 프리뷰)과 같은 흰 카드에 숫자만 주황으로 — 위아래로 살짝 떠서 눈길을 끈다.
              // 아래 본문 위로 떠야 해서 z를 올리되, 시트·딤(z-40)보다는 아래에 둔다
              <span
                aria-hidden
                data-testid="smalltalk-free-nudge"
                className="absolute top-full left-1/2 z-30 mt-3 -translate-x-1/2 motion-safe:animate-[nudge-bob_1.4s_ease-in-out_infinite]"
              >
                <span className="relative block rounded-2xl bg-card px-4 py-3 text-14 leading-[1.45] font-bold whitespace-nowrap text-foreground shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                  <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-card" />
                  {t.rich('smalltalkFreeNudgeCaption', {
                    em: (chunks) => (
                      <span className="text-primary">{chunks}</span>
                    ),
                    limit: toSpeakingTimeLabel(
                      main.dailySpeakingTimeLimitMs,
                      locale,
                    ),
                  })}
                </span>
              </span>
            )}
            {tab.id === 'smalltalk' && !introSeen && !showsNudge && (
              // 점은 읽어 주지 않는다 — 탭에 들어가면 첫 안내가 같은 말을 접근성까지 갖춰 다시 한다.
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
