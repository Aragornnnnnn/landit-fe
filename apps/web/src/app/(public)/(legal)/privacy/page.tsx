// 개인정보 처리방침 페이지 — 로그인 없이 접근 가능한 공개 라우트
import { privacyDocument } from '@/app/(public)/(legal)/_content/privacy-document';
import { LegalDocumentPage } from '@/app/(public)/(legal)/_ui/LegalDocumentPage';

const PrivacyPage = () => (
  <LegalDocumentPage
    document={privacyDocument}
    backHref="/me"
    backLabel="내 정보로 돌아가기"
  />
);

export default PrivacyPage;
