// 이모지를 토스페이스 SVG로 그린다 — 웹폰트를 받지 않으므로 첫 렌더에 바로 최종 모습이 나온다
// 크기는 부모의 font-size를 따라간다. 기존 text-2xl 같은 클래스를 그대로 두면 된다
import { EMOJI_MARKUP } from './emoji-map';

interface EmojiProps {
  /** 이모지 문자 하나 */
  children: string;
  /** 뜻을 전달하는 이모지에만 준다. 없으면 화면 낭독기에서 감춘다 */
  label?: string;
  className?: string;
}

export const Emoji = ({ children, label, className }: EmojiProps) => {
  const markup = EMOJI_MARKUP[children];
  const meaning = label
    ? { role: 'img' as const, 'aria-label': label }
    : { 'aria-hidden': true };

  // 맵에 없는 이모지는 문자 그대로 둔다 — OS 이모지로 그려질 뿐 자리와 뜻은 그대로 간다
  if (!markup) {
    return (
      <span className={className} {...meaning}>
        {children}
      </span>
    );
  }

  return (
    <svg
      // 폰트 비트맵이 112ppem에 128px라 글리프가 8/7em으로 그려진다 — 같은 크기로 맞춘다
      viewBox="0 0 40 40"
      width="1.143em"
      height="1.143em"
      // Tailwind preflight가 svg를 block으로 만든다 — 글자 자리에 놓이려면 되돌려야 한다
      className={`inline-block ${className ?? ''}`}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: markup }}
      {...meaning}
    />
  );
};
