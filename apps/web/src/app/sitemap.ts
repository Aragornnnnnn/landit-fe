// 사이트맵 — 검색에 노출할 공개 화면 목록. 랜딩은 언어별 주소를 서로 묶어 알리고, 수정일은 가장 최근 업데이트 날짜를 따른다
import type { MetadataRoute } from 'next';

import { SITE_URL } from './(public)/[lang]/_model/structured-data';
import { UPDATES } from './(public)/[lang]/updates/_ui/updates-content';

const LANDING_LANGUAGES = {
  ko: `${SITE_URL}/ko`,
  ja: `${SITE_URL}/ja`,
  'x-default': SITE_URL,
};

const sitemap = (): MetadataRoute.Sitemap => {
  const lastModified = UPDATES[0].date;
  const landing = (url: string) => ({
    url,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 1,
    alternates: { languages: LANDING_LANGUAGES },
  });
  return [
    landing(LANDING_LANGUAGES.ko),
    landing(LANDING_LANGUAGES.ja),
    ...(['ko', 'ja'] as const).map((locale) => ({
      url: `${SITE_URL}/${locale}/updates`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
      alternates: {
        languages: {
          ko: `${SITE_URL}/ko/updates`,
          ja: `${SITE_URL}/ja/updates`,
        },
      },
    })),
    ...(['terms', 'privacy'] as const).flatMap((kind) =>
      (['ko', 'ja'] as const).map((locale) => ({
        url: `${SITE_URL}/${locale}/${kind}`,
        priority: 0.2,
        alternates: {
          languages: {
            ko: `${SITE_URL}/ko/${kind}`,
            ja: `${SITE_URL}/ja/${kind}`,
          },
        },
      })),
    ),
  ];
};

export default sitemap;
