// 서비스 이용약관 페이지 — 로그인 없이 접근 가능한 공개 라우트
import { LegalDocumentPage } from '@/components/LegalDocumentPage';
import { termsDocument } from '@/lib/terms-document';

const TermsPage = () => (
  <LegalDocumentPage
    document={termsDocument}
    backHref="/"
    backLabel="홈으로 돌아가기"
  />
);

export default TermsPage;
