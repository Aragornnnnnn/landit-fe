'use client';

// 마이페이지 상단 — 이름과 로그인 계정, 오른쪽에 학습 수준의 마법사 래디와 레벨 이름. 수준을 아직 모르면 기본 래디만 선다.
// 마법사와 레벨은 결제가 열린 환경(플래그·1.3.0 셸)에서만 — 수준 평가가 그 흐름에서 시작되니 그전엔 보여줄 게 없다
import Image from 'next/image';

import {
  LEVEL_IMAGES,
  LEVEL_NAMES,
} from '@/features/feedback/model/level-assessment';
import { toEnglishLevel } from '@/features/onboarding/model/english-level';
import { useLearningLevelQuery } from '@/features/onboarding/model/useLearningLevelQuery';
import { PAYMENT_ENABLED } from '@/features/subscription/model/payment-flag';
import { canLockPaywall } from '@/features/subscription/model/paywall-gate';
import { useAuthStore } from '@/shared/auth/auth-store';
import { getNativeContextSnapshot } from '@/shared/bridge/native-context';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { AppleIcon, GoogleIcon, KakaoIcon } from '@/shared/ui/SocialIcons';

const DEFAULT_IMAGE = '/images/character/landy-normal.webp';

// 로그인한 곳을 작은 원 배지로 — 각 사 브랜드 색 위에 아이콘
const PROVIDER_BADGE: Record<
  string,
  { icon: React.ReactNode; background: string }
> = {
  KAKAO: { icon: <KakaoIcon size={11} />, background: '#FEE500' },
  GOOGLE: { icon: <GoogleIcon size={10} />, background: '#fff' },
  APPLE: { icon: <AppleIcon size={11} />, background: '#000' },
};

export const ProfileHeader = () => {
  const member = useAuthStore((state) => state.member);
  const { data, isPending } = useLearningLevelQuery();
  const level = toEnglishLevel(data?.learningLevel ?? null);
  const badge = member?.provider ? PROVIDER_BADGE[member.provider] : undefined;
  // 프리미엄 카드와 같은 조건 — 결제 브릿지가 실린 셸에서 플래그가 켜져 있을 때
  const context = useClientOnlyValue(getNativeContextSnapshot, null);
  const levelVisible = canLockPaywall({
    paymentEnabled: PAYMENT_ENABLED,
    appVersion: context?.appVersion ?? null,
  });

  return (
    <div className="flex items-center justify-between px-1.5 pt-2 pb-1">
      <div className="min-w-0">
        <p
          className="text-[22px] leading-tight font-bold"
          style={{ color: '#111' }}
        >
          {member?.nickname?.trim() || '게스트'}
        </p>
        {member?.email && (
          <p
            className="mt-1.5 flex items-center gap-1.5 text-[12.5px]"
            style={{ color: '#6b7280' }}
          >
            {badge && (
              <span
                className="flex size-4 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: badge.background,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.06)',
                }}
                aria-hidden="true"
              >
                {badge.icon}
              </span>
            )}
            <span className="truncate">{member.email}</span>
          </p>
        )}
      </div>
      {/* 수준을 받는 동안은 자리만 잡는다 — 기본 래디가 떴다가 레벨 래디로 바뀌는 걸 막는다 */}
      {levelVisible && (
        <div className="flex min-h-[112px] shrink-0 flex-col items-center">
          {!isPending && (
            <Image
              src={level ? LEVEL_IMAGES[level] : DEFAULT_IMAGE}
              alt=""
              width={112}
              height={112}
              className="h-[112px] w-auto"
            />
          )}
          {level && (
            <p
              className="mt-0.5 text-[12.5px] font-bold"
              style={{ color: '#111' }}
            >
              {LEVEL_NAMES[level]} Lv.{level}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
