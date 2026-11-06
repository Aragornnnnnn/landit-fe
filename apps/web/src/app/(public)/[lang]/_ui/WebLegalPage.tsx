// 웹 약관 페이지 틀 — 랜딩과 같은 머리·바닥글 안에 약관 문서를 넣는다. 앱 안의 /terms·/privacy 화면과 같은 문서 데이터를 쓴다
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import type { LegalDocument } from '@/app/(app)/(legal)/_ui/LegalDocumentPage';
import type { Locale } from '@/shared/i18n/locale';

import { LandingFooter } from './LandingFooter';
import { LandingHeader } from './LandingHeader';
import { WebLegalDocument } from './WebLegalDocument';

type Kind = 'terms' | 'privacy';

const SITE_NAME: Record<Locale, string> = { ko: '랜딧', ja: 'Landit' };

/** 언어별 주소를 서로 알리는 약관 메타데이터 */
export const buildLegalMetadata = (
  locale: Locale,
  kind: Kind,
  document: LegalDocument,
): Metadata => ({
  // 루트 제목 틀(%s | 랜딧)은 한국어라 언어별 사이트 이름을 직접 붙인다
  title: { absolute: `${document.title} | ${SITE_NAME[locale]}` },
  description: document.introduction[0],
  alternates: {
    canonical: `/${locale}/${kind}`,
    languages: { ko: `/ko/${kind}`, ja: `/ja/${kind}` },
  },
  robots: { index: true, follow: true },
});

export const WebLegalPage = async ({
  locale,
  document,
}: {
  locale: Locale;
  document: LegalDocument;
}) => {
  const t = await getTranslations({ locale, namespace: 'legal.documentPage' });
  const toc = await getTranslations({ locale, namespace: 'landing.legal' });
  return (
    <div className="bg-card text-foreground">
      <LandingHeader locale={locale} />
      <main>
        <WebLegalDocument
          document={document}
          labels={{
            effectiveDate: t('effectiveDateLabel'),
            toc: toc('tocLabel'),
          }}
        />
      </main>
      <LandingFooter locale={locale} />
    </div>
  );
};
