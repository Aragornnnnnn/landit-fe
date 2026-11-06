// 웹 서비스 이용약관(/ko/terms·/ja/terms) — 랜딩에서 이어지는 웹 문서. 앱 안에서는 /terms 화면을 쓴다
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { termsDocumentJa } from '@/app/(app)/(legal)/terms/document.ja';
import { termsDocument } from '@/app/(app)/(legal)/terms/document.ko';
import { isLocale } from '@/shared/i18n/locale';

import { buildLegalMetadata, WebLegalPage } from '../_ui/WebLegalPage';

type Props = { params: Promise<{ lang: string }> };

const DOCUMENTS = { ko: termsDocument, ja: termsDocumentJa };

const localeOf = async (params: Props['params']) => {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return lang;
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const locale = await localeOf(params);
  return buildLegalMetadata(locale, 'terms', DOCUMENTS[locale]);
};

const WebTermsPage = async ({ params }: Props) => {
  const locale = await localeOf(params);
  return <WebLegalPage locale={locale} document={DOCUMENTS[locale]} />;
};

export default WebTermsPage;
