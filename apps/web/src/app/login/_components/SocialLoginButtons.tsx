'use client';

// 로그인 화면의 소셜 버튼 3종 — 클릭을 useSocialLogin에 연결하고 에러를 노출한다
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';

import { useSocialLogin } from '../_hooks/useSocialLogin';
import styles from '../login-motion.module.css';
import { LoginButton } from './LoginButton';
import { AppleIcon, GoogleIcon, KakaoIcon } from './SocialIcons';

export const SocialLoginButtons = () => {
  const { login, pending, error } = useSocialLogin();
  const busy = pending !== null;
  // 애플 로그인은 iOS 전용이라 안드로이드 WebView에서는 버튼 자체를 숨긴다
  const isAndroid = useClientOnlyValue(
    () => /Android/i.test(navigator.userAgent),
    false,
  );

  return (
    <div className={`${styles.buttons} flex flex-col gap-3`}>
      {error && (
        <p className="text-center text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <LoginButton
        label="카카오로 로그인하기"
        icon={<KakaoIcon />}
        className="bg-[#FEE500] text-[#191919]"
        onClick={() => login('kakao')}
        disabled={busy}
      />
      <LoginButton
        label="구글로 로그인하기"
        icon={<GoogleIcon />}
        className="bg-white text-foreground ring-1 ring-border"
        onClick={() => login('google')}
        disabled={busy}
      />
      {!isAndroid && (
        <LoginButton
          label="애플로 로그인하기"
          icon={<AppleIcon />}
          className="bg-black text-white"
          onClick={() => login('apple')}
          disabled={busy}
        />
      )}
    </div>
  );
};
