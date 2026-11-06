// 검색엔진·AI 크롤러 규칙 — 소개 화면은 이름을 밝혀 열어 두고 API와 로그인 콜백만 막는다. /download는 공유 미리보기 봇이 읽어야 해서 열어 둔다. 앱 화면은 noindex를 읽어야 하므로 여기서 막지 않는다
import type { MetadataRoute } from 'next';

import { SITE_URL } from './(public)/[lang]/_model/structured-data';

const DISALLOW = ['/api/', '/auth/'];

const CRAWLERS = [
  '*',
  'Googlebot',
  'Yeti',
  'Bingbot',
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'Google-Extended',
];

const robots = (): MetadataRoute.Robots => ({
  rules: CRAWLERS.map((userAgent) => ({
    userAgent,
    allow: '/',
    disallow: DISALLOW,
  })),
  sitemap: `${SITE_URL}/sitemap.xml`,
});

export default robots;
