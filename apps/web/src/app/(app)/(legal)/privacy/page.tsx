// 개인정보 처리방침 페이지 — 로그인 없이 접근 가능한 공개 라우트. 화면 언어의 문서를 보여 준다
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

import type { Locale } from '@/shared/i18n/locale';

import {
  LegalDocumentPage,
  type LegalDocument,
} from '../_ui/LegalDocumentPage';
import { privacyDocumentJa } from './document.ja';
import { privacyDocument } from './document.ko';

export const metadata: Metadata = {
  title: '개인정보 처리방침',
  description: '랜딧 개인정보 처리방침이에요.',
  // 앱 안 화면이라 검색에서 뺀다 — 검색에는 같은 문서의 웹 판(/ko·/ja)이 나간다
  robots: { index: false, follow: true },
};

const DOCUMENTS: Record<Locale, LegalDocument> = {
  ko: privacyDocument,
  ja: privacyDocumentJa,
};

const PrivacyPage = async () => (
  <LegalDocumentPage document={DOCUMENTS[await getLocale()]} />
);

export default PrivacyPage;
