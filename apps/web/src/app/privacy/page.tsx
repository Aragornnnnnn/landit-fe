// 개인정보 처리방침 페이지 — 로그인 없이 접근 가능한 공개 라우트
import { LegalDocumentPage } from '@/components/LegalDocumentPage';
import { privacyDocument } from '@/lib/privacy-document';

const PrivacyPage = () => (
  <LegalDocumentPage
    document={privacyDocument}
    backHref="/"
    backLabel="홈으로 돌아가기"
  />
);

export default PrivacyPage;
