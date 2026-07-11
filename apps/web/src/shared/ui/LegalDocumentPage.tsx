'use client';

// 개인정보 처리방침·서비스 이용약관 공통 레이아웃 — 문서 데이터를 받아 카드형으로 렌더한다
import { useRouter } from 'next/navigation';

import type { LegalDocument } from '@/shared/lib/legal-document';

interface LegalDocumentPageProps {
  document: LegalDocument;
  backHref: string;
  backLabel: string;
}

const ChevronLeftIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M15 18l-6-6 6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const LegalDocumentPage = ({
  document,
  backHref,
  backLabel,
}: LegalDocumentPageProps) => {
  const router = useRouter();

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-muted">
      <header className="relative flex shrink-0 items-center border-b border-border bg-background px-4 pt-[max(env(safe-area-inset-top),16px)] pb-2">
        <button
          type="button"
          onClick={() => router.replace(backHref)}
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-all active:scale-90 active:bg-border"
          aria-label={backLabel}
        >
          <ChevronLeftIcon />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-foreground">
          {document.title}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pb-[max(env(safe-area-inset-bottom),64px)]">
          {/* 시행일·버전 메타 정보 */}
          <div className="mt-4 mb-6 overflow-hidden rounded-xl bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
              <span className="text-sm text-muted-foreground">시행일</span>
              <span className="text-sm font-medium text-foreground">
                {document.effectiveDate}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-muted-foreground">문서 버전</span>
              <span className="text-sm font-medium text-foreground">
                {document.version}
              </span>
            </div>
          </div>

          {document.introduction.length > 0 && (
            <div className="mb-4 space-y-3">
              {document.introduction.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm leading-7 text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {document.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="overflow-hidden rounded-xl bg-card px-4 py-4"
              >
                <h2 className="text-[15px] font-bold text-foreground">
                  {section.title}
                </h2>
                <div className="mt-2 space-y-2">
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-sm leading-7 text-muted-foreground"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets && (
                    <ul className="mt-2 list-disc space-y-1.5 pl-5">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="text-sm leading-7 text-muted-foreground"
                        >
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};
