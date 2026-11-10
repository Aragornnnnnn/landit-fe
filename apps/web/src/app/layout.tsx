// 전체 공통 레이아웃 (루트) — html과 언어, 첫 페인트 전 스크립트만 둔다. 앱 전용 기능은 (app)/layout.tsx에 있어 랜딩이 그 무게를 지지 않는다. 폰트는 globals.css에서 자체 호스팅하는 Pretendard 하나뿐이다
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { getLocale } from 'next-intl/server';

import { platformMarkerScript } from '@/shared/bridge/platform-marker';
import { fontScaleScript } from '@/shared/font-scale/font-scale';
import { RootMessagesProvider } from '@/shared/i18n/MessagesProvider';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.landit.im'),
  title: { default: '랜딧', template: '%s | 랜딧' },
  description: 'AI 캐릭터와 영어로 대화하며 연습하는 영어 회화 앱 랜딧',
  // 유튜브와 같은 구성 — favicon.ico(16·32, app 폴더 파일)에 더해 32·48·96·144 PNG. 구글은 48의 배수 정사각형을 파비콘으로 쓴다
  icons: {
    icon: [
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      {
        url: '/icons/favicon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
      },
    ],
  },
};

// viewport-fit=cover가 있어야 노치 기기에서 env(safe-area-inset-*)가 실제 값으로 평가된다 (DESIGN.md safe-area 규칙의 전제)
// 웹뷰 셸 — 확대(핀치·더블탭) 차단 (웹앱을 앱 전용으로 보고 전역 적용)
export const viewport: Viewport = {
  viewportFit: 'cover',
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 저장 언어 쿠키(없으면 Accept-Language)로 정한 화면 언어 — API 요청도 html lang을 읽어 같은 언어를 보낸다
  const locale = await getLocale();

  return (
    <html lang={locale} className="antialiased" suppressHydrationWarning>
      <body>
        {/* 첫 페인트 전에 플랫폼을 찍는다 — 하이드레이션 뒤에 찍으면 Android 하단 여백이 한 번 점프한다 */}
        <script dangerouslySetInnerHTML={{ __html: platformMarkerScript }} />
        {/* 첫 페인트 전에 글자 크기를 적용한다 — 하이드레이션 뒤에 적용하면 보통 크기로 그려졌다가 한 번 바뀐다 */}
        <script dangerouslySetInnerHTML={{ __html: fontScaleScript }} />
        {/* 브라우저엔 어디서나 쓰는 common만 보낸다 — 화면 문구는 그 화면의 layout이 MessagesProvider로 자기 묶음을 더한다 */}
        <RootMessagesProvider>
          {children}
          <SpeedInsights />
        </RootMessagesProvider>
      </body>
    </html>
  );
}
