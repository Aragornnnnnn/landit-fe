// 웹 약관 문서 본문 — 앱 화면과 같은 문서 데이터를 넓은 화면에서 읽기 좋게 펼친다. 목차를 눌러 조항으로 바로 간다. 문서 버전은 내부 관리용이라 웹에선 시행일만 보인다
import type { LegalDocument } from '@/app/(app)/(legal)/_ui/LegalDocumentPage';

type Labels = { effectiveDate: string; toc: string };

export const WebLegalDocument = ({
  document,
  labels,
}: {
  document: LegalDocument;
  labels: Labels;
}) => (
  <article className="mx-auto max-w-[760px] px-6 pt-10 pb-16 sm:pt-16">
    <h1 className="text-[32px] leading-[1.3] font-bold break-keep sm:text-[40px]">
      {document.title}
    </h1>
    <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[15px] text-[#57524c]">
      <div className="flex gap-2">
        <dt>{labels.effectiveDate}</dt>
        <dd className="font-semibold text-foreground">
          {document.effectiveDate}
        </dd>
      </div>
    </dl>

    {document.introduction.length > 0 && (
      <div className="mt-8 space-y-3">
        {document.introduction.map((paragraph) => (
          <p
            key={paragraph}
            className="text-[16px] leading-[1.8] break-keep text-[#3f3b37]"
          >
            {paragraph}
          </p>
        ))}
      </div>
    )}

    <nav
      aria-label={labels.toc}
      className="mt-10 rounded-[20px] bg-[#f5f5f3] px-6 py-5"
    >
      <p className="text-[14px] font-bold text-[#57524c]">{labels.toc}</p>
      <ol className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {document.sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="text-[15px] break-keep text-foreground underline-offset-2 hover:underline"
            >
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>

    <div className="mt-12 space-y-12">
      {document.sections.map((section) => (
        // 위에 붙은 머리글에 가리지 않게 목차로 왔을 때 조금 띄운다
        <section key={section.id} id={section.id} className="scroll-mt-24">
          <h2 className="text-[21px] leading-snug font-bold break-keep">
            {section.title}
          </h2>
          <div className="mt-3 space-y-3">
            {section.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-[16px] leading-[1.8] break-keep text-[#3f3b37]"
              >
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul className="list-disc space-y-2 pl-5">
                {section.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="text-[16px] leading-[1.8] break-keep text-[#3f3b37]"
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
  </article>
);
