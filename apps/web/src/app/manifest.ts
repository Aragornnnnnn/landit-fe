// 웹 앱 정보 — 브라우저와 검색엔진이 읽는 이름, 아이콘, 색
import type { MetadataRoute } from 'next';

const manifest = (): MetadataRoute.Manifest => ({
  name: '랜딧 - AI 영어 회화 앱',
  short_name: '랜딧',
  description: '원어민과 대화하며 내 영어가 어떻게 들리는지 확인해요',
  start_url: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#e07a3a',
  icons: [
    { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
});

export default manifest;
