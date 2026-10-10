'use client';

// 프리미엄 온보딩 점검 화면(ADMIN) — 결제하지 않고 케이스별로 프리미엄 온보딩을 연다. 다 보면 이 화면으로 돌아온다
import { useRouter } from 'next/navigation';

import { useAlarmSettingQuery } from '@/features/alarm/model/useAlarmSettingQuery';
import { useAuthStore } from '@/shared/auth/auth-store';
import {
  backToMyPage,
  PREMIUM_ONBOARDING_CHECK_PATH,
  premiumOnboardingPath,
} from '@/shared/lib/routes';
import { BackHeader } from '@/shared/ui/BackHeader';
import { Emoji } from '@/shared/ui/emoji';

import { MenuLink, MenuSection } from '../../../_ui/Menu';

// 케이스 목록 — 알람 설정을 읽으므로 ADMIN일 때만 올린다
const OnboardingCases = () => {
  const { data: setting } = useAlarmSettingQuery();

  const asIs =
    setting === undefined
      ? '결제 직후와 똑같이 열어요'
      : setting.enabled
        ? '지금은 알람을 등록해 둔 계정이라 환영만 보여요'
        : '지금은 알람 등록 전이라 알람 등록까지 가요';

  return (
    <>
      <MenuSection title="지금 내 상태로">
        <MenuLink
          href={premiumOnboardingPath(PREMIUM_ONBOARDING_CHECK_PATH)}
          icon={<Emoji>🎉</Emoji>}
          title="결제 직후 그대로 보기"
          description={asIs}
        />
      </MenuSection>

      <MenuSection title="케이스를 골라서 — 다짐하면 이 계정의 실제 알람 시각이 바뀌어요">
        <MenuLink
          href={premiumOnboardingPath(PREMIUM_ONBOARDING_CHECK_PATH, 'alarm')}
          icon={<Emoji>⏰</Emoji>}
          title="처음 결제한 사람"
          description="환영 → 알람 소개 → 다짐 → 권한 → 완료"
        />
        <MenuLink
          href={premiumOnboardingPath(PREMIUM_ONBOARDING_CHECK_PATH, 'refund')}
          icon={<Emoji>💸</Emoji>}
          title="환급 참여자"
          description="알람 소개와 다짐이 환급 문구로 나와요"
        />
        <MenuLink
          href={premiumOnboardingPath(PREMIUM_ONBOARDING_CHECK_PATH, 'welcome')}
          icon={<Emoji>👋</Emoji>}
          title="알람 단계가 없는 사람"
          description="알람을 등록해 둔 재구독자 · 알람을 못 쓰는 폰"
        />
      </MenuSection>

      <div className="rounded-xl bg-card px-4 py-4 text-[13px] leading-relaxed text-foreground">
        <p>
          · 권한을 거절한 경우(“거의 다 됐어요”)는 폰 설정에서 알람 권한을 끄고
          ‘처음 결제한 사람’을 열면 보여요
        </p>
        <p>· 「다음에 할게요」는 알람 소개 화면 아래에 있어요</p>
        <p>
          · 페이월에서 이어지는 이동(결제 뒤 원래 화면으로)은 실제 결제로만
          확인돼요
        </p>
      </div>
    </>
  );
};

export const PremiumOnboardingCheckScreen = () => {
  const router = useRouter();
  const isAdmin = useAuthStore((state) => state.member?.role === 'ADMIN');

  return (
    <main className="flex h-dvh flex-col bg-muted">
      <BackHeader
        title="프리미엄 온보딩 점검"
        onBack={() => backToMyPage(router)}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 px-4 pt-3 pb-10">
          {isAdmin ? (
            <OnboardingCases />
          ) : (
            <p className="rounded-xl bg-card px-4 py-4 text-sm text-muted-foreground">
              ADMIN 계정에서만 볼 수 있어요
            </p>
          )}
        </div>
      </div>
    </main>
  );
};
