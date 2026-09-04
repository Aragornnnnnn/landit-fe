// 편지 본문 마크다운 렌더러 — 깃허브 코멘트처럼 엔터 한 번이 줄바꿈이고, 링크·이미지·표를 그린다.
// 유저가 쓴 글이 들어오므로 react-markdown 기본 안전장치(javascript: 주소 제거)를 그대로 두고,
// 본문에 적은 HTML 태그는 깃허브처럼 그리지도 보여주지도 않는다(skipHtml) — 글자로 남기면 문단 밖 맨 텍스트가 돼 간격이 깨진다
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

const plugins = [remarkGfm, remarkBreaks];

export const MarkdownBody = ({ text }: { text: string }) => (
  <div className="letter-markdown">
    <Markdown remarkPlugins={plugins} skipHtml>
      {text}
    </Markdown>
  </div>
);
