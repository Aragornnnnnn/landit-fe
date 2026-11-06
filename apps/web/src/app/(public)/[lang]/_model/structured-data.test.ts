// 랜딩 구조화 데이터 — 검색엔진과 AI가 읽을 앱 정보·질문 답변이 언어마다 빠지지 않는지 검증
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';

import type { Locale } from '@/shared/i18n/locale';
import ja from '@/shared/i18n/locales/ja';
import ko from '@/shared/i18n/locales/ko';
import { mergeMessages } from '@/shared/i18n/messages';

import { buildLandingFaq } from './landing-faq';
import {
  buildStructuredData,
  buildUpdatesStructuredData,
  SITE_URL,
} from './structured-data';

const translatorOf = (locale: Locale) =>
  createTranslator({
    locale,
    messages: (locale === 'ja' ? mergeMessages(ko, ja) : ko) as typeof ko,
    namespace: 'landing',
  });

const findByType = (type: string, locale: Locale = 'ko') =>
  buildStructuredData(locale, translatorOf(locale)).find(
    (item) => item['@type'] === type,
  );

describe('buildStructuredData', () => {
  it('앱 정보에 두 스토어 주소와 지원 운영체제를 담는다', () => {
    // Given / When
    const app = findByType('MobileApplication');

    // Then
    expect(app?.operatingSystem).toBe('iOS, Android');
    expect(app?.downloadUrl).toEqual([
      expect.stringContaining('apps.apple.com'),
      expect.stringContaining('play.google.com'),
    ]);
  });

  it('두 언어 모두 앱 정보에 두 스토어를 합친 평점과 평가 수를 담는다 — 화면 첫 뱃지에 같은 평점이 보인다', () => {
    const rating = {
      '@type': 'AggregateRating',
      ratingValue: 4.8,
      ratingCount: 59,
      bestRating: 5,
    };

    expect(findByType('MobileApplication')?.aggregateRating).toEqual(rating);
    expect(findByType('MobileApplication', 'ja')?.aggregateRating).toEqual(
      rating,
    );
  });

  it('앱 정보에 다운로드 가격과 그 언어의 주요 기능을 담는다', () => {
    const app = findByType('MobileApplication');
    const appJa = findByType('MobileApplication', 'ja');

    expect(app?.offers).toEqual({
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'KRW',
    });
    expect(appJa?.offers).toEqual({
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'JPY',
    });
    expect(app?.featureList).toEqual(
      expect.arrayContaining(['원어민 속마음 피드백', '발음 평가']),
    );
    expect(appJa?.featureList).toEqual(expect.arrayContaining(['発音評価']));
  });

  it('언어마다 그 언어 주소와 언어 표시를 단다', () => {
    expect(findByType('WebSite')?.url).toBe(`${SITE_URL}/ko`);
    expect(findByType('WebSite', 'ja')?.url).toBe(`${SITE_URL}/ja`);
    expect(findByType('MobileApplication', 'ja')?.inLanguage).toBe('ja');
  });

  it('회사 정보에 스토어 주소를 같은 주체로 연결한다', () => {
    expect(findByType('Organization')?.sameAs).toEqual([
      expect.stringContaining('apps.apple.com'),
      expect.stringContaining('play.google.com'),
    ]);
  });

  it('로고는 검색엔진이 쓸 수 있는 큰 아이콘을 쓴다', () => {
    expect(findByType('Organization')?.logo).toBe(
      `${SITE_URL}/brand/icon-512.png`,
    );
  });

  it('화면의 질문과 답변을 그대로 FAQ로 담는다', () => {
    const faq = buildLandingFaq(translatorOf('ja'));

    expect(findByType('FAQPage', 'ja')?.mainEntity).toHaveLength(faq.length);
    expect(findByType('FAQPage', 'ja')?.mainEntity).toContainEqual({
      '@type': 'Question',
      name: faq[0].question,
      acceptedAnswer: { '@type': 'Answer', text: faq[0].answer },
    });
  });

  it('사이트 주소는 실제로 응답하는 www 주소를 쓴다', () => {
    expect(SITE_URL).toBe('https://www.landit.im');
  });

  it('첫 질문은 AI가 인용할 수 있게 앱을 한 문장으로 정의한다', () => {
    expect(buildLandingFaq(translatorOf('ko'))[0].answer).toContain(
      '영어 회화 앱',
    );
    expect(buildLandingFaq(translatorOf('ja'))[0].answer).toContain(
      '英会話アプリ',
    );
  });
});

describe('buildUpdatesStructuredData', () => {
  it('업데이트를 최신순 목록으로 담고 그 언어의 목록 이름을 붙인다', () => {
    // Given
    const updates = [
      { date: '2026-11-05', title: '新機能' },
      { date: '2026-06-15', title: '初リリース' },
    ];

    // When
    const data = buildUpdatesStructuredData('ja', updates);

    // Then
    expect(data.name).toBe('Landit アップデート履歴');
    expect(data.inLanguage).toBe('ja');
    expect(data.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Article',
          headline: '新機能',
          datePublished: '2026-11-05',
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: {
          '@type': 'Article',
          headline: '初リリース',
          datePublished: '2026-06-15',
        },
      },
    ]);
  });
});
