// 서비스 이용약관 페이지 — 로그인 없이 접근 가능한 공개 라우트
import { LegalDocumentPage } from '@/app/(public)/(legal)/_ui/LegalDocumentPage';

import { termsDocument } from './document';

const TermsPage = () => (
  <LegalDocumentPage
    document={termsDocument}
    backHref="/me"
    backLabel="내 정보로 돌아가기"
  />
);

export default TermsPage;
