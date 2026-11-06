// 서비스 이용약관 페이지 — 로그인 없이 접근 가능한 공개 라우트. 화면 언어의 문서를 보여 준다
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

import type { Locale } from '@/shared/i18n/locale';

import {
  LegalDocumentPage,
  type LegalDocument,
} from '../_ui/LegalDocumentPage';
import { termsDocumentJa } from './document.ja';
import { termsDocument } from './document.ko';

export const metadata: Metadata = {
  title: '서비스 이용약관',
  description: '랜딧 서비스 이용약관이에요.',
  // 앱 안 화면이라 검색에서 뺀다 — 검색에는 같은 문서의 웹 판(/ko·/ja)이 나간다
  robots: { index: false, follow: true },
};

const DOCUMENTS: Record<Locale, LegalDocument> = {
  ko: termsDocument,
  ja: termsDocumentJa,
};

const TermsPage = async () => (
  <LegalDocumentPage document={DOCUMENTS[await getLocale()]} />
);

export default TermsPage;
