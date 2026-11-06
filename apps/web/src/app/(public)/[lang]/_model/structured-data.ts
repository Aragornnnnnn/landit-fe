// 랜딩 구조화 데이터(JSON-LD) — 검색엔진과 AI 답변이 앱 정보를 정확히 읽게 한다
import type { Locale } from '@/shared/i18n/locale';
import type { Translator } from '@/shared/i18n/translator';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/shared/lib/store-listing';

import { buildLandingFaq } from './landing-faq';
import { LANDING_STATS } from './landing-stats';

export const SITE_URL = 'https://www.landit.im';

/** 구조화 데이터 기능 목록 순서 — 문구는 landing.structuredData */
const FEATURE_KEYS = [
  'scenarioLabel',
  'thoughtLabel',
  'correctionLabel',
  'expressionLabel',
  'pronunciationLabel',
  'smallTalkLabel',
  'roleplayLabel',
  'accentLabel',
] as const;

/** 앱 다운로드 가격을 적는 통화 — 무료라 금액은 0이고 그 언어 사용자의 통화만 다르다 */
const CURRENCY: Record<Locale, string> = { ko: 'KRW', ja: 'JPY' };

/** 캡처를 다시 찍으면 올린다 — 같은 주소의 옛 그림이 브라우저에 하루 동안 남기 때문이다 */
const SCREENS_VERSION = 3;

/** 폰 화면 캡처 경로 — 일본어 화면은 일본어로 다시 찍은 캡처를 쓴다 */
export const screenPath = (locale: Locale, shot: string) =>
  `/images/landing/screens/${locale === 'ja' ? 'ja/' : ''}${shot}.webp?v=${SCREENS_VERSION}`;

/** '2026. 11. 5.' → '2026-11-05' */
export const toIsoDate = (date: string) => {
  const [year, month, day] = date.match(/\d+/g) ?? [];
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * 그 언어 랜딩의 구조화 데이터. 평점은 두 언어 화면 첫 뱃지에 보이는 두 스토어 합산 값이다.
 *
 * @param t landing 문구 번역 함수(그 언어)
 */
export const buildStructuredData = (
  locale: Locale,
  t: Translator<'landing'>,
): Record<string, unknown>[] => {
  const name = t('meta.appNameLabel');
  const alternateName = locale === 'ko' ? 'Landit' : '랜딧';
  const url = `${SITE_URL}/${locale}`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name,
      alternateName,
      url,
      inLanguage: locale,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name,
      alternateName,
      url: SITE_URL,
      logo: `${SITE_URL}/brand/icon-512.png`,
      sameAs: [APP_STORE_URL, PLAY_STORE_URL],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      name,
      alternateName,
      description: t('meta.description'),
      url,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'iOS, Android',
      image: `${SITE_URL}/brand/icon-512.png`,
      screenshot: `${SITE_URL}${screenPath(locale, 'thought-bad')}`,
      inLanguage: locale,
      downloadUrl: [APP_STORE_URL, PLAY_STORE_URL],
      featureList: FEATURE_KEYS.map((key) => t(`structuredData.${key}`)),
      offers: { '@type': 'Offer', price: 0, priceCurrency: CURRENCY[locale] },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: LANDING_STATS.rating.value,
        ratingCount: LANDING_STATS.rating.count,
        bestRating: 5,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: buildLandingFaq(t).map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
  ];
};

export const buildUpdatesStructuredData = (
  updates: { date: string; title: string }[],
) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: '랜딧 업데이트 기록',
  itemListElement: updates.map(({ date, title }, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'Article',
      headline: title,
      datePublished: toIsoDate(date),
    },
  })),
});

/** 폰 화면 캡처를 화면에 그릴 때의 크기·화질 — 폰 폭(휴대폰 322px·그 이상 366px)의 화면 자리(90%)만큼만 받는다. 작은 글자가 흐려지지 않게 화질은 90 */
export const SCREEN_IMAGE = {
  width: 780,
  height: 1688,
  sizes: '(min-width: 640px) 330px, 290px',
  quality: 90,
} as const;
