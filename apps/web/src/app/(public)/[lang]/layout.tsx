// 랜딩 언어 구간 — /ko·/ja 두 주소만 만든다. 화면 문구는 전부 서버에서 그려, 브라우저로는 문구 묶음을 보내지 않는다. 방문·다운로드 누름·머문 시간은 LandingAnalytics가 남긴다
import type { Viewport } from 'next';

import { LOCALES } from '@/shared/i18n/locale';

import { LandingAnalytics } from './_ui/LandingAnalytics';

// 지원 언어가 아닌 첫 칸(/en, /foo)은 404다
export const dynamicParams = false;

// 웹 페이지는 확대를 막지 않는다 — 앱 화면(루트 레이아웃)은 확대를 막지만 랜딩·업데이트 기록·약관은 글자를 키워 읽을 수 있어야 한다
export const viewport: Viewport = {
  viewportFit: 'cover',
  maximumScale: 5,
  userScalable: true,
};

export const generateStaticParams = () => LOCALES.map((lang) => ({ lang }));

const LandingLocaleLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    {children}
    <LandingAnalytics />
  </>
);

export default LandingLocaleLayout;
