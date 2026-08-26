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

  // 맵에 없는 이모지는 문자 그대로 둔다 — OS 이모지로 그려지더라도 뜻은 전달된다
  if (!markup) return <>{children}</>;

  return (
    <svg
      // 토스페이스가 글자로 그릴 때와 같은 크기로 그린다.
      // 폰트 비트맵이 112ppem에 128px라 글리프는 정확히 8/7em(1.143em)이고, 기준점 오프셋이 0이라
      // 그림 아랫변이 글줄에 얹힌다. 상자를 잉크와 같게 두면 flex 가운데 정렬 자리에서 폰트와 위치가 일치한다.
      // 대신 글 흐름 안에서는 줄 상자가 0.077em 커진다 — 글자는 잉크가 줄을 넘어도 되지만 그림은 못 넘기 때문.
      // 큰 이모지는 전부 고정 크기 칸 안에 있어 영향이 없고, 글 안에 섞인 곳은 11~30px이라 1~3px 수준이다
      viewBox="0 0 40 40"
      width="1.143em"
      height="1.143em"
      // Tailwind preflight가 svg를 block으로 만든다 — 글자 자리에 놓이려면 되돌려야 한다
      className={`inline-block ${className ?? ''}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
};
