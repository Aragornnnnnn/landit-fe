// 로그인 화면 — 소셜 로그인 진입점 + 네이티브 스플래시에서 이어지는 진입 모션. 버튼은 목업이며 실제 인증은 OAuth 이슈에서 연결한다
import { LanditLogo } from '@/components/landit-logo';

import { LoginButton } from './login-button';
import styles from './login-motion.module.css';
import { AppleIcon, GoogleIcon, KakaoIcon } from './social-icons';

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

      <div className={`${styles.buttons} flex flex-col gap-3`}>
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
    </div>
  </main>
);

export default LoginPage;
