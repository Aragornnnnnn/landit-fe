// 법률 문서(개인정보 처리방침·이용약관) 공통 타입 — 내용 수정 시 시행일과 버전을 함께 올릴 것
export type LegalDocument = {
  title: string;
  effectiveDate: string;
  version: string;
  introduction: string[];
  sections: Array<{
    id: string;
    title: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
};
