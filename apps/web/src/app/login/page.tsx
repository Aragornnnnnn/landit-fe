// 로그인 화면 — 소셜 로그인 진입점 + 네이티브 스플래시에서 이어지는 진입 모션
import { LanditLogo } from '@/shared/ui/LanditLogo';

import { AuthedRedirect } from './_components/AuthedRedirect';
import { DevLoginButton } from './_components/DevLoginButton';
import { SocialLoginButtons } from './_components/SocialLoginButtons';
import styles from './login-motion.module.css';

// 세션 내 재방문이면 모션을 스킵하도록 첫 페인트 전에 html에 클래스 부여 (FOUC 방지 위해 인라인 블로킹 스크립트 — useEffect는 이미 한 프레임 그려진 뒤라 늦음)
const splashSkip = `
  try {
    if (sessionStorage.getItem('landit-splash-played')) {
      document.documentElement.classList.add('splash-played');
    } else {
      sessionStorage.setItem('landit-splash-played', '1');
    }
  } catch (e) {}
`;

const LoginPage = () => (
  <main className="relative mx-auto h-dvh max-w-[430px] overflow-x-hidden overflow-y-auto bg-background">
    <script dangerouslySetInnerHTML={{ __html: splashSkip }} />
    <AuthedRedirect />

    <div className={styles.logoWrap}>
      <LanditLogo className={`${styles.logo} h-12 text-foreground`} />
    </div>

    <div
      className={`${styles.content} flex flex-col px-6 pt-[calc(env(safe-area-inset-top)+258px)] pb-[max(env(safe-area-inset-bottom),24px)]`}
    >
      <p
        className={`${styles.tagline} text-center text-[17px] leading-relaxed font-semibold text-muted-foreground`}
      >
        방금 그 영어, 진짜 통했을까?
        <br />
        외국인 속마음을 들려드려요
      </p>

      <div className="flex-1" />

      <SocialLoginButtons />
      {/* 개발용 로그인 우회 — 플래그 켜졌을 때만 노출 (LAN-83 worktree 웹 확인용) */}
      <DevLoginButton />
    </div>
  </main>
);

export default LoginPage;
