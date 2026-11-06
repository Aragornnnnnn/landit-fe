// 구조화 데이터 태그 — 글 안의 <를 이스케이프해 script 밖으로 빠져나가지 못하게 한다
export const JsonLd = ({ data }: { data: unknown }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(data).replace(/</g, '\\u003c'),
    }}
  />
);
