// 웹 개인정보 처리방침(/ko/privacy·/ja/privacy) — 랜딩에서 이어지는 웹 문서. 앱 안에서는 /privacy 화면을 쓴다
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { privacyDocumentJa } from '@/app/(app)/(legal)/privacy/document.ja';
import { privacyDocument } from '@/app/(app)/(legal)/privacy/document.ko';
import { isLocale } from '@/shared/i18n/locale';

import { buildLegalMetadata, WebLegalPage } from '../_ui/WebLegalPage';

type Props = { params: Promise<{ lang: string }> };

const DOCUMENTS = { ko: privacyDocument, ja: privacyDocumentJa };

const localeOf = async (params: Props['params']) => {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return lang;
};

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const locale = await localeOf(params);
  return buildLegalMetadata(locale, 'privacy', DOCUMENTS[locale]);
};

const WebPrivacyPage = async ({ params }: Props) => {
  const locale = await localeOf(params);
  return <WebLegalPage locale={locale} document={DOCUMENTS[locale]} />;
};

export default WebPrivacyPage;
