'use client';

// 환급 페이월 미리보기 화면(ADMIN) — 실제 환급 페이월을 그대로 띄우되 결제·복원은 하지 않고, 결제 금액 안내 노출도 찍지 않는다. 닫으면 내 정보로 돌아간다
import { useRouter } from 'next/navigation';

import { buildRewardPlan } from '@/app/(protected)/paywall/_model/paywall-content';
import { StepPaywall } from '@/app/(protected)/paywall/_ui/StepPaywall';
import { useIsAdmin } from '@/shared/auth/current-member';
import { backToMyPage } from '@/shared/lib/routes';
import { BackHeader } from '@/shared/ui/BackHeader';

export const RewardPaywallCheckScreen = () => {
  const router = useRouter();
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return (
      <main className="flex h-dvh flex-col bg-muted">
        <BackHeader
          title="환급 페이월 보기"
          onBack={() => backToMyPage(router)}
        />
        <p className="m-4 rounded-xl bg-card px-4 py-4 text-sm text-muted-foreground">
          ADMIN 계정에서만 볼 수 있어요
        </p>
      </main>
    );
  }

  return (
    <StepPaywall
      offer={{ kind: 'pass', plan: buildRewardPlan() }}
      busy={false}
      onClose={() => backToMyPage(router)}
      onRestore={() => {}}
      onPurchase={() => {}}
      preview
    />
  );
};
