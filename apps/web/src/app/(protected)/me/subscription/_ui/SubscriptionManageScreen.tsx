'use client';

// 구독 관리 화면 — 골드 카드에 플랜 붙은 상태 제목과 결제일·결제 금액 표, 이용 중인 혜택, 결제 내역 진입, 맨 아래 해지.
// 앱은 구독을 바꾸거나 해지할 수 없어 전부 스토어 구독 화면으로 보낸다. 플랜 이름·금액·결제 내역은 BE가
// 상품 식별자와 결제 이벤트를 주면 붙인다 (docs/subscription.md 「마이페이지와 법적 문서」)
import { EVENTS, type StoreSubscriptionAction } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { formatSubscriptionDate } from '@/features/subscription/lib/subscription-date';
import {
  findPlan,
  formatWon,
  MONTHLY_PLAN,
} from '@/features/subscription/model/plans';
import {
  resolveStorePlatform,
  STORE,
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
import {
  backToMyPage,
  MY_PAGE_PATH,
  paywallPath,
  SUBSCRIPTION_HISTORY_PATH,
} from '@/shared/lib/routes';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { BackHeader } from '@/shared/ui/BackHeader';
import { Emoji } from '@/shared/ui/emoji';
import { AppStoreIcon, GooglePlayIcon } from '@/shared/ui/StoreIcons';

import { MenuGroup, MenuLink } from '../../_ui/Menu';

const TITLE: Record<PaidSubscriptionSummary['kind'], string> = {
  trial: '무료 체험 중이에요',
  active: '프리미엄을 쓰고 있어요',
  canceled: '해지가 예약됐어요',
};

// 맨 아래 해지 행 — 상태마다 지금 할 수 있는 일 하나. 해지 예약이면 되돌리는 쪽이다
const CANCEL_ROW: Record<
  PaidSubscriptionSummary['kind'],
  { action: StoreSubscriptionAction; title: string }
> = {
  active: { action: 'cancel', title: '구독 해지하기' },
  trial: { action: 'cancel', title: '체험 해지하기' },
  canceled: { action: 'resubscribe', title: '해지 취소하기' },
};

// 제목 — 구독 중이고 플랜을 알면 "월간 프리미엄"처럼 플랜을 앞에 붙인다
const toTitle = (summary: PaidSubscriptionSummary) =>
  summary.kind === 'active' && summary.plan
    ? `${findPlan(summary.plan).title} ${TITLE.active}`
    : TITLE[summary.kind];

// 날짜 행 — 무엇의 날짜인지가 상태마다 다르다. 체험은 첫 결제, 구독은 다음 결제, 그날로 끝나면 만료
const toDateRow = (summary: PaidSubscriptionSummary) => {
  const date = summary.expiresAt
    ? formatSubscriptionDate(summary.expiresAt)
    : null;
  if (!date) return null;
  if (summary.kind === 'trial') return { label: '첫 결제일', value: date };
  if (summary.renews) return { label: '다음 결제일', value: date };
  return { label: '이용 만료일', value: `${date} · 자동 갱신 꺼짐` };
};

// 결제 금액 행 — 갱신되는 구독만, BE가 상품 식별자를 줄 때만. 연간은 월간으로 1년 낼 때 금액을 지운 값 옆에 혜택가로 보여준다
const toAmountRow = (summary: PaidSubscriptionSummary) => {
  if (!summary.plan || !summary.renews) return null;
  const plan = findPlan(summary.plan);
  return {
    label: summary.kind === 'trial' ? '첫 결제 금액' : '다음 결제 금액',
    listPrice:
      summary.plan === 'yearly' ? formatWon(MONTHLY_PLAN.price * 12) : null,
    value: formatWon(plan.price),
  };
};

export const SubscriptionManageScreen = () => {
  const router = useRouter();
  const { subscription, isPending, isError } = useSubscriptionQuery();
  const context = useClientOnlyValue(getNativeContextSnapshot, null);
  // 결제한 스토어(BE)가 우선, 없으면 셸 플랫폼, 브라우저는 iOS — 애플 구독 페이지는 웹에서도 열린다
  const platform = resolveStorePlatform(subscription?.store, context?.platform);
  const store = STORE[platform];
  const storeIcon = platform === 'ios' ? <AppStoreIcon /> : <GooglePlayIcon />;

  const summary = summarizeSubscription(subscription);
  const dateRow = summary.kind === 'none' ? null : toDateRow(summary);
  const amountRow = summary.kind === 'none' ? null : toAmountRow(summary);

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
              <p className="mt-3 text-[17px] font-bold">{toTitle(summary)}</p>
              {(dateRow || amountRow) && (
                <dl className="mt-3 space-y-1.5 text-[13px]">
                  {dateRow && (
                    <div className="flex justify-between gap-3">
                      <dt style={{ opacity: 0.75 }}>{dateRow.label}</dt>
                      <dd className="font-semibold">{dateRow.value}</dd>
                    </div>
                  )}
                  {amountRow && (
                    <div className="flex justify-between gap-3">
                      <dt style={{ opacity: 0.75 }}>{amountRow.label}</dt>
                      <dd className="font-semibold">
                        {amountRow.listPrice && (
                          <s
                            className="mr-1.5 font-normal"
                            style={{ opacity: 0.6 }}
                          >
                            {amountRow.listPrice}
                          </s>
                        )}
                        {amountRow.value}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </section>

            <section>
              <h2
                className="mb-2 ml-1.5 text-[12px] font-medium"
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
                href={SUBSCRIPTION_HISTORY_PATH}
                icon={<Emoji>🧾</Emoji>}
                title="결제 내역"
                onClick={() =>
                  track(EVENTS.SUBSCRIPTION_HISTORY_TAPPED, {
                    status: summary.kind,
                  })
                }
              />
            </MenuGroup>

            <MenuGroup>
              <MenuLink
                href={store.manageUrl}
                icon={storeIcon}
                title={CANCEL_ROW[summary.kind].title}
                onClick={() =>
                  track(EVENTS.STORE_SUBSCRIPTION_TAPPED, {
                    status: summary.kind,
                    action: CANCEL_ROW[summary.kind].action,
                  })
                }
              />
            </MenuGroup>
          </>
        )}
      </div>
    </main>
  );
};
