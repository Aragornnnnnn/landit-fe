// 웹 약관 메타데이터 — 언어마다 제목 끝 사이트 이름과 주소 연결이 맞는지 검증
import { describe, expect, it } from 'vitest';

import { buildLegalMetadata } from './WebLegalPage';

const document = {
  title: '利用規約',
  effectiveDate: '2026-01-01',
  introduction: ['本規約は…'],
  sections: [],
} as unknown as Parameters<typeof buildLegalMetadata>[2];

describe('buildLegalMetadata', () => {
  it('일본어 약관 제목 끝엔 Landit을 붙인다', () => {
    // Given 일본어 이용약관 문서
    // When 메타데이터를 만들면
    const metadata = buildLegalMetadata('ja', 'terms', document);
    // Then 제목이 일본어 사이트 이름으로 끝난다
    expect(metadata.title).toEqual({ absolute: '利用規約 | Landit' });
  });

  it('한국어 약관 제목 끝엔 랜딧을 붙인다', () => {
    const metadata = buildLegalMetadata('ko', 'privacy', {
      ...document,
      title: '개인정보 처리방침',
    });

    expect(metadata.title).toEqual({ absolute: '개인정보 처리방침 | 랜딧' });
  });

  it('대표 주소와 두 언어 주소를 함께 알린다', () => {
    const metadata = buildLegalMetadata('ja', 'terms', document);

    expect(metadata.alternates).toEqual({
      canonical: '/ja/terms',
      languages: { ko: '/ko/terms', ja: '/ja/terms' },
    });
  });

  it('공유 카드는 그 언어의 공유 그림을 쓴다', () => {
    const metadata = buildLegalMetadata('ja', 'terms', document);

    expect(metadata.openGraph?.images).toEqual({
      url: '/og/share-ja.jpg',
      width: 1200,
      height: 630,
    });
  });
});
