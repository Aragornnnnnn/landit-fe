'use client';

// 구독 관리 화면 — 골드 카드(플랜 붙은 상태 제목, 결제일·결제 금액 행), 이용 중인 혜택, 구독 묶음(결제 내역·해지 행).
// 앱은 구독을 바꾸거나 해지할 수 없어 스토어 구독 화면으로 보낸다 (docs/subscription.md 「마이페이지와 법적 문서」).
// 해지만은 사유 플로우(/me/subscription/cancel)를 먼저 거친다.
// 100일 이용권은 구독이 아니라 화면을 따로 둔다 — 다음 결제도 해지도 없이 만료일과 결제 내역만 있다
import { EVENTS, type StoreSubscriptionAction } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import {
  STORE,
  type StorePlatform,
} from '@/features/subscription/model/my-subscription/store-links';
import {
  canCancelAtStore,
  summarizeSubscription,
  type PaidSubscriptionSummary,
} from '@/features/subscription/model/my-subscription/subscription-summary';
import { useStorePlatform } from '@/features/subscription/model/my-subscription/useStorePlatform';
import { useSubscriptionQuery } from '@/features/subscription/model/my-subscription/useSubscriptionQuery';
import {
  GOLD_GRADIENT,
  PremiumBadge,
} from '@/features/subscription/ui/premium-brand';
import { BenefitList } from '@/features/subscription/ui/product/BenefitList';
import { track } from '@/shared/analytics';
import {
  backToMyPage,
  MY_PAGE_PATH,
  paywallPath,
  SUBSCRIPTION_CANCEL_PATH,
  SUBSCRIPTION_HISTORY_PATH,
} from '@/shared/lib/routes';
import { BackHeader } from '@/shared/ui/BackHeader';
import { Emoji } from '@/shared/ui/emoji';
import { AppStoreIcon, GooglePlayIcon } from '@/shared/ui/StoreIcons';

import {
  toAmountRow,
  toCardTitle,
  toDateRow,
  type CardRow,
} from '../_model/subscription-card';
import { MenuGroup, MenuLink, MenuSection } from '../../_ui/Menu';

// 맨 아래 스토어 행 — 상태마다 지금 할 수 있는 일 하나. 해지 예약이면 되돌리는 쪽이다
const STORE_ROW: Record<
  PaidSubscriptionSummary['kind'],
  { action: StoreSubscriptionAction; title: string }
> = {
  active: { action: 'cancel', title: '구독 해지하기' },
  trial: { action: 'cancel', title: '체험 해지하기' },
  canceled: { action: 'resubscribe', title: '해지 취소하기' },
};

// 스토어에서 손댈 구독이 있는 상태만 — 해지할 구독(판정은 해지 사유 화면과 공유)과 해지 예약.
// 갱신이 없는 기간(대시보드 프로모션·선결제)은 스토어에 구독이 없어 보내면 빈 화면이 뜬다
const toStoreRow = (summary: PaidSubscriptionSummary) => {
  if (summary.kind === 'canceled') return STORE_ROW.canceled;
  return canCancelAtStore(summary) ? STORE_ROW[summary.kind] : null;
};

const CardRowItem = ({ row }: { row: CardRow }) => (
  <div className="flex justify-between gap-3">
    <dt style={{ opacity: 0.75 }}>{row.label}</dt>
    <dd className="font-semibold">
      {row.listPrice && (
        <s className="mr-1.5 font-normal" style={{ opacity: 0.6 }}>
          <span className="sr-only">정가 </span>
          {row.listPrice}
        </s>
      )}
      {row.value}
    </dd>
  </div>
);

// 골드 카드와 이용 중인 혜택 — 구독과 이용권 화면이 같이 쓴다
const PremiumOverview = ({ summary }: { summary: PaidSubscriptionSummary }) => {
  const rows = [toDateRow(summary), toAmountRow(summary)].filter(
    (row) => row !== null,
  );

  return (
    <>
      <section
        className="rounded-xl px-4 pt-4 pb-4"
        style={{ background: GOLD_GRADIENT, color: '#3a2500' }}
      >
        <PremiumBadge logoHeight={22} onGold />
        <p className="mt-3 text-[17px] font-bold">{toCardTitle(summary)}</p>
        {rows.length > 0 && (
          <dl className="mt-3 space-y-1.5 text-[13px]">
            {rows.map((row) => (
              <CardRowItem key={row.label} row={row} />
            ))}
          </dl>
        )}
      </section>

      <MenuSection title="이용 중인 혜택">
        <div className="pb-5">
          <BenefitList />
        </div>
      </MenuSection>
    </>
  );
};

const HistoryLink = ({ summary }: { summary: PaidSubscriptionSummary }) => (
  <MenuLink
    href={SUBSCRIPTION_HISTORY_PATH}
    icon={<Emoji>🧾</Emoji>}
    title="결제 내역"
    onClick={() =>
      track(EVENTS.SUBSCRIPTION_HISTORY_TAPPED, { status: summary.kind })
    }
  />
);

// 100일 이용권 — 한 번 결제하고 끝나는 상품이라 스토어로 보낼 일이 없다
const PassSubscription = ({
  summary,
}: {
  summary: PaidSubscriptionSummary;
}) => (
  <>
    <PremiumOverview summary={summary} />
    <MenuSection title="이용권">
      <HistoryLink summary={summary} />
    </MenuSection>
  </>
);

interface PaidSubscriptionProps {
  summary: PaidSubscriptionSummary;
  platform: StorePlatform;
}

const PaidSubscription = ({ summary, platform }: PaidSubscriptionProps) => {
  const store = STORE[platform];
  const storeRow = toStoreRow(summary);
  const storeIcon = platform === 'ios' ? <AppStoreIcon /> : <GooglePlayIcon />;

  return (
    <>
      <PremiumOverview summary={summary} />

      <MenuSection title="구독">
        <HistoryLink summary={summary} />
        {storeRow?.action === 'cancel' && (
          // 해지는 바로 스토어로 보내지 않는다 — 사유를 묻고 사유별 화면을 거친 뒤 그 안의 링크로 나간다
          <MenuLink
            href={SUBSCRIPTION_CANCEL_PATH}
            icon={storeIcon}
            title={storeRow.title}
          />
        )}
        {storeRow?.action === 'resubscribe' && (
          <MenuLink
            href={store.manageUrl}
            icon={storeIcon}
            title={storeRow.title}
            onClick={() =>
              track(EVENTS.STORE_SUBSCRIPTION_TAPPED, {
                status: summary.kind,
                action: storeRow.action,
              })
            }
          />
        )}
      </MenuSection>
    </>
  );
};

// 유료가 아닌데 들어온 경우(만료·환불·직접 진입) — 페이월로 안내한다
const NoSubscription = () => (
  <MenuGroup>
    <MenuLink
      href={paywallPath({ from: MY_PAGE_PATH, source: 'me' })}
      title="구독 중이 아니에요 · 프리미엄 구독하기"
    />
  </MenuGroup>
);

export const SubscriptionManageScreen = () => {
  const router = useRouter();
  const { subscription, isPending, isError } = useSubscriptionQuery();
  // 브라우저는 iOS — 애플 구독 페이지는 웹에서도 열린다
  const platform = useStorePlatform(subscription?.store);
  const summary = summarizeSubscription(subscription);
  const pass = summary.kind !== 'none' && summary.plan === 'pass';

  const body = () => {
    // 받는 중이거나 실패했으면 비워 둔다 — 유료 사용자에게 "구독 중이 아니에요"를 잘못 보여주지 않는다 (PremiumEntry와 같은 규칙)
    if (isPending || isError) return null;
    if (summary.kind === 'none') return <NoSubscription />;
    if (pass) return <PassSubscription summary={summary} />;
    return <PaidSubscription summary={summary} platform={platform} />;
  };

  return (
    <main className="flex h-dvh flex-col bg-background">
      <BackHeader
        title={pass ? '이용권 관리' : '구독 관리'}
        onBack={() => backToMyPage(router)}
      />
      <div className="flex-1 space-y-4 overflow-y-auto bg-muted px-4 pt-4 pb-[max(var(--safe-area-inset-bottom),32px)]">
        {body()}
      </div>
    </main>
  );
};
