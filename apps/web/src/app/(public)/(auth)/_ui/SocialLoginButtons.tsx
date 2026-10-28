'use client';

// 로그인 화면의 소셜 버튼들 — 클릭을 useSocialLogin에 연결하고 에러를 노출한다.
// 콜백처럼 바깥에서 진행 중인 로그인이 있으면(pending·error) 그 상태를 이어받아 그린다
import { useLocale, useTranslations } from 'next-intl';

import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { AppleIcon, GoogleIcon, KakaoIcon } from '@/shared/ui/SocialIcons';

import { readLastLoginProvider } from '../_model/last-login-provider';
import { loginProvidersOf } from '../_model/login-providers';
import { useSocialLogin, type SocialProvider } from '../_model/useSocialLogin';
import styles from './login-motion.module.css';
import { LoginButton } from './LoginButton';

// 제공자별 버튼 모양 — 색은 각 브랜드 규정색이다
const BUTTONS = {
  kakao: {
    labelKey: 'kakaoButton',
    icon: <KakaoIcon />,
    className: 'bg-[#FEE500] text-[#191919]',
  },
  google: {
    labelKey: 'googleButton',
    icon: <GoogleIcon />,
    className: 'bg-white text-foreground ring-1 ring-border',
  },
  apple: {
    labelKey: 'appleButton',
    icon: <AppleIcon />,
    className: 'bg-black text-white',
  },
} as const satisfies Record<SocialProvider, object>;

export const SocialLoginButtons = ({
  pending: outerPending = null,
  error: outerError = null,
}: {
  pending?: SocialProvider | null;
  error?: string | null;
}) => {
  const social = useSocialLogin();
  const pending = outerPending ?? social.pending;
  const error = outerError ?? social.error;
  const { login } = social;
  const busy = pending !== null;
  // 애플 로그인은 iOS 전용이라 안드로이드 WebView에서는 버튼 자체를 숨긴다
  const isAndroid = useClientOnlyValue(
    () => /Android/i.test(navigator.userAgent),
    false,
  );
  // 로그인이 진행 중이면 표시를 내린다 — 다른 방법으로 들어가는 중에 지난 방법을 가리키지 않게
  const lastProvider = useClientOnlyValue(readLastLoginProvider, null);
  const recent = busy ? null : lastProvider;
  const t = useTranslations('auth.socialLogin');
  const locale = useLocale();
  const providers = loginProvidersOf({
    locale,
    android: isAndroid,
    lastProvider,
  });

  return (
    <div className={`${styles.buttons} flex flex-col gap-3`}>
      {error && (
        <p className="mb-2 text-center text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      {providers.map((provider) => (
        <LoginButton
          key={provider}
          label={t(BUTTONS[provider].labelKey)}
          icon={BUTTONS[provider].icon}
          className={BUTTONS[provider].className}
          onClick={() => login(provider)}
          disabled={busy}
          loading={pending === provider}
          recent={recent === provider}
        />
      ))}
    </div>
  );
};
