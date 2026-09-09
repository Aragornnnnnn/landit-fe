'use client';

// 마이페이지 프리미엄 카드 — 골드 한 줄. 무료면 페이월로, 유료면 구독 관리로 간다.
// 결제할 수 없는 환경(브라우저·구버전 셸·플래그 꺼짐)의 무료 사용자에겐 그리지 않는다 (docs/subscription.md 「마이페이지와 법적 문서」)
import { EVENTS } from '@landit/analytics';
import Link from 'next/link';

import { PAYMENT_ENABLED } from '@/features/subscription/model/payment-flag';
import { canLockPaywall } from '@/features/subscription/model/paywall-gate';
import {
  summarizeSubscription,
  type SubscriptionSummary,
} from '@/features/subscription/model/subscription-summary';
import { useSubscriptionQuery } from '@/features/subscription/model/useSubscriptionQuery';
import {
  GOLD_GRADIENT,
  PremiumBadge,
} from '@/features/subscription/ui/premium-brand';
import { track } from '@/shared/analytics';
import { getNativeContextSnapshot } from '@/shared/bridge/native-context';
import {
  MY_PAGE_PATH,
  paywallPath,
  SUBSCRIPTION_MANAGE_PATH,
} from '@/shared/lib/routes';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { ChevronRightIcon } from '@/shared/ui/Icons';

const LABEL: Record<Exclude<SubscriptionSummary['kind'], 'none'>, string> = {
  trial: '무료 체험 중',
  active: '프리미엄 이용 중',
  canceled: '해지 예정',
};

export const PremiumEntry = () => {
  const { subscription, isPending, isError } = useSubscriptionQuery();
  // 셸 컨텍스트는 클라이언트에서만 — 서버 렌더와 첫 렌더를 맞추려고 그때까지는 브라우저로 본다
  const context = useClientOnlyValue(getNativeContextSnapshot, null);

  // 받는 중이거나 실패했으면 그리지 않는다 — 잠깐 보였다 바뀌는 카드보다 없는 편이 낫다
  if (isPending || isError) return null;

  const summary = summarizeSubscription(subscription);

  // 결제 브릿지가 실린 셸에서 플래그가 켜져 있을 때만 — 게이트가 잠글 수 있는 환경과 같은 조건이다
  if (
    summary.kind === 'none' &&
    !canLockPaywall({
      paymentEnabled: PAYMENT_ENABLED,
      appVersion: context?.appVersion ?? null,
    })
  ) {
    return null;
  }

  const entry =
    summary.kind === 'none'
      ? {
          href: paywallPath({ from: MY_PAGE_PATH }),
          label: '프리미엄 구독하기',
          onClick: () =>
            track(EVENTS.PAYWALL_ENTRY_TAPPED, { source: 'my_page' }),
        }
      : {
          href: SUBSCRIPTION_MANAGE_PATH,
          label: LABEL[summary.kind],
          onClick: () =>
            track(EVENTS.SUBSCRIPTION_MANAGE_TAPPED, { status: summary.kind }),
        };

  return (
    <Link
      href={entry.href}
      onClick={entry.onClick}
      className="flex items-center gap-3 rounded-xl px-4 py-3.5 active:opacity-90"
      style={{ background: GOLD_GRADIENT, color: '#4a2f00' }}
    >
      <PremiumBadge logoHeight={20} onGold />
      <span className="ml-auto text-[14.5px] font-bold whitespace-nowrap">
        {entry.label}
      </span>
      <ChevronRightIcon
        size={16}
        className="shrink-0"
        style={{ color: '#8a5a00' }}
      />
    </Link>
  );
};
