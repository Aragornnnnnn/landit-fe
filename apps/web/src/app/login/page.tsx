// 로그인 화면 — 소셜 로그인 진입점. 버튼은 목업이며 실제 인증은 OAuth 이슈에서 연결한다
import { LanditLogo } from '@/components/landit-logo';

import { LoginButton } from './login-button';
import { AppleIcon, GoogleIcon, KakaoIcon } from './social-icons';

const LoginPage = () => (
  <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background px-6 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),24px)]">
    <div className="flex flex-col items-center gap-4 pt-24">
      <LanditLogo className="h-10 text-foreground" />
      <p className="text-center text-[15px] leading-relaxed font-semibold text-muted-foreground">
        내 영어가 외국인한테
        <br />
        진짜 통했는지 알려드려요
      </p>
    </div>

    <div className="flex-1" />

    <div className="flex flex-col gap-3">
      <LoginButton
        label="카카오로 로그인하기"
        icon={<KakaoIcon />}
        className="bg-[#FEE500] text-[#191919]"
      />
      <LoginButton
        label="구글로 로그인하기"
        icon={<GoogleIcon />}
        className="bg-white text-foreground ring-1 ring-border"
      />
      <LoginButton
        label="애플로 로그인하기"
        icon={<AppleIcon />}
        className="bg-black text-white"
      />
    </div>
  </main>
);

export default LoginPage;
