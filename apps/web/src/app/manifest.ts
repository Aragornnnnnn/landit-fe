// 웹 앱 정보 — 브라우저와 검색엔진이 읽는 이름, 아이콘, 색
import type { MetadataRoute } from 'next';

const manifest = (): MetadataRoute.Manifest => ({
  name: '랜딧 - AI 영어 회화 앱',
  short_name: '랜딧',
  description: '원어민과 대화하며 내 영어가 어떻게 들리는지 확인해요',
  // 홈 화면에 추가한 웹 앱은 랜딩이 아니라 앱 홈에서 시작한다
  start_url: '/scenario',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#e07a3a',
  icons: [
    { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
});

export default manifest;
