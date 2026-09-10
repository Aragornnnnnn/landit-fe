'use client';

// 구독 관리 화면 — 골드 카드에 상태와 날짜, 이용 중인 혜택, 스토어 구독 관리 링크, 맨 아래 환불 안내 한 줄.
// 플랜 이름·금액·결제 내역은 BE가 상품 식별자와 결제 이벤트를 주면 여기에 붙는다 (docs/subscription.md 「마이페이지와 법적 문서」)
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { formatSubscriptionDate } from '@/features/subscription/lib/subscription-date';
import {
  STORE,
  type StorePlatform,
} from '@/features/subscription/model/store-links';
import {
  summarizeSubscription,
  type PaidSubscriptionSummary,
} from '@/features/subscription/model/subscription-summary';
import { useSubscriptionQuery } from '@/features/subscription/model/useSubscriptionQuery';
import { BenefitList } from '@/features/subscription/ui/BenefitList';
import {
  GOLD_GRADIENT,
  PremiumBadge,
} from '@/features/subscription/ui/premium-brand';
import { track } from '@/shared/analytics';
import { getNativeContextSnapshot } from '@/shared/bridge/native-context';
import { backToMyPage, MY_PAGE_PATH, paywallPath } from '@/shared/lib/routes';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { BackHeader } from '@/shared/ui/BackHeader';
import { Emoji } from '@/shared/ui/emoji';

import { MenuGroup, MenuLink } from '../../_ui/Menu';

const TITLE: Record<PaidSubscriptionSummary['kind'], string> = {
  trial: '무료 체험 중이에요',
  active: '프리미엄을 쓰고 있어요',
  canceled: '해지가 예약됐어요',
};

// 날짜 한 줄 — 무엇의 날짜인지가 상태마다 다르다. 체험은 첫 결제, 구독은 다음 결제, 그날로 끝나면 만료
const toDateLine = (summary: PaidSubscriptionSummary) => {
  const date = summary.expiresAt
    ? formatSubscriptionDate(summary.expiresAt)
    : null;
  if (!date) return null;
  if (summary.kind === 'trial') return `첫 결제일 ${date}`;
  if (summary.renews) return `다음 결제일 ${date}`;
  return `이용 만료일 ${date} · 자동 갱신 꺼짐`;
};

export const SubscriptionManageScreen = () => {
  const router = useRouter();
  const { subscription, isPending, isError } = useSubscriptionQuery();
  const context = useClientOnlyValue(getNativeContextSnapshot, null);
  // 브라우저에는 플랫폼이 없다 — 애플 구독 페이지는 웹에서도 열려 그쪽을 기본으로 둔다
  const platform: StorePlatform = context?.platform ?? 'ios';
  const store = STORE[platform];

  const summary = summarizeSubscription(subscription);
  const dateLine = summary.kind === 'none' ? null : toDateLine(summary);

  return (
    <main className="flex h-dvh flex-col bg-background">
      <BackHeader title="구독 관리" onBack={() => backToMyPage(router)} />

      <div className="flex-1 space-y-4 overflow-y-auto bg-muted px-4 pt-4 pb-8">
        {/* 받는 중이거나 실패했으면 비워 둔다 — 유료 사용자에게 "구독 중이 아니에요"를 잘못 보여주지 않는다 (PremiumEntry와 같은 규칙) */}
        {isPending || isError ? null : summary.kind === 'none' ? (
          // 유료가 아닌데 들어온 경우(만료·환불·직접 진입) — 페이월로 안내한다
          <MenuGroup>
            <MenuLink
              href={paywallPath({ from: MY_PAGE_PATH })}
              title="구독 중이 아니에요 · 프리미엄 구독하기"
            />
          </MenuGroup>
        ) : (
          <>
            <section
              className="rounded-xl px-4 pt-4 pb-4"
              style={{ background: GOLD_GRADIENT, color: '#3a2500' }}
            >
              <PremiumBadge logoHeight={22} onGold />
              <p className="mt-3 text-[17px] font-bold">
                {TITLE[summary.kind]}
              </p>
              {dateLine && (
                <p className="mt-1 text-[13px]" style={{ opacity: 0.85 }}>
                  {dateLine}
                </p>
              )}
            </section>

            <section>
              <h2
                className="mb-2 ml-1.5 text-[12.5px] font-medium"
                style={{ color: '#6b7280' }}
              >
                이용 중인 혜택
              </h2>
              <div className="rounded-xl pb-5" style={{ background: '#fff' }}>
                <BenefitList />
              </div>
            </section>

            <MenuGroup>
              <MenuLink
                href={store.manageUrl}
                icon={<Emoji>💳</Emoji>}
                title={`${store.name}에서 구독 관리`}
                onClick={() =>
                  track(EVENTS.STORE_SUBSCRIPTION_TAPPED, {
                    status: summary.kind,
                  })
                }
              />
            </MenuGroup>

            <p
              className="px-2 text-center text-[12px] leading-[1.7]"
              style={{ color: '#6b7280' }}
            >
              해지해도 남은 기간은 계속 이용할 수 있어요.
              <br />
              환불은{' '}
              <a
                href={store.refundUrl}
                className="underline underline-offset-2"
                onClick={() =>
                  track(EVENTS.REFUND_LINK_TAPPED, { status: summary.kind })
                }
              >
                {store.refundLabel}
              </a>
              에서 요청해요.
            </p>
          </>
        )}
      </div>
    </main>
  );
};
