// 서비스 이용약관 페이지 — 로그인 없이 접근 가능한 공개 라우트. 화면 언어의 문서를 보여 준다
import { getLocale } from 'next-intl/server';

import type { Locale } from '@/shared/i18n/locale';

import {
  LegalDocumentPage,
  type LegalDocument,
} from '../_ui/LegalDocumentPage';
import { termsDocumentJa } from './document.ja';
import { termsDocument } from './document.ko';

const DOCUMENTS: Record<Locale, LegalDocument> = {
  ko: termsDocument,
  ja: termsDocumentJa,
};

const TermsPage = async () => (
  <LegalDocumentPage document={DOCUMENTS[await getLocale()]} />
);

export default TermsPage;
