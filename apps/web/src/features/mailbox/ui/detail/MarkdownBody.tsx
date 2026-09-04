// 편지 본문 마크다운 렌더러 — 깃허브 코멘트처럼 엔터 한 번이 줄바꿈이고, 링크·이미지·표를 그린다.
// 유저가 쓴 글이 들어오므로 react-markdown 기본 안전장치를 그대로 둔다. raw HTML은 실행하지 않고 글자로만 보이고, javascript: 주소는 링크에서 빠진다
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import styles from './MarkdownBody.module.css';

const plugins = [remarkGfm, remarkBreaks];

// 글자 크기·색은 className으로 받는다 — 본문과 인용이 같은 렌더러를 다른 톤으로 쓴다
export const MarkdownBody = ({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) => (
  <div className={`${styles.root} ${className}`}>
    <Markdown remarkPlugins={plugins} skipHtml>
      {text}
    </Markdown>
  </div>
);
