// 만든 시나리오가 없을 때 — 상대마다 자극적인 상황 카드 한 장씩, 세 장이 한 뭉치에서 부채꼴로 펼쳐지며 무엇을 만드는 곳인지 바로 보이게 한다
import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';

import { lineBreak } from '@/shared/i18n/rich';
import { GradientSparkle } from '@/shared/ui/GradientSparkle';

// 그림과 글이 짝이고, 무대 크기에 비례하는 부채꼴이다
const IDEA_CARDS = [
  {
    key: 'presidentIdeaLabel',
    src: '/images/roleplay/idea-president.webp',
    className: 'left-[3.5%] top-[27%] w-[32%]',
    rotate: '-6deg',
    fromX: '96px',
    delay: '0.12s',
  },
  {
    key: 'alienIdeaLabel',
    src: '/images/roleplay/idea-alien.webp',
    className: 'left-[64.5%] top-[20%] w-[32%]',
    rotate: '6deg',
    fromX: '-96px',
    delay: '0.12s',
  },
  {
    key: 'zombieIdeaLabel',
    src: '/images/roleplay/idea-zombie.webp',
    className: 'left-[34%] top-[9%] z-10 w-[32%]',
    rotate: '0deg',
    fromX: '0px',
    delay: '0s',
  },
] as const;

const SPARKLES = [
  { className: 'top-[6%] right-[17%]', size: 22 },
  { className: 'top-[14%] left-[16%]', size: 14 },
] as const;

export const RoleplayEmpty = () => {
  const t = useTranslations('roleplay.home');

  return (
    <div className="flex flex-col items-center pt-5">
      <div
        className="relative aspect-[390/310] w-full max-w-[390px]"
        aria-hidden
      >
        {/* 카드 뒤 빛 하나 — 각 카드의 색이 섞이고, 머리와 글자에 닿기 전에 사라진다 */}
        <div className="animate-soft-in absolute inset-x-[-14%] -top-5 -bottom-10 bg-[radial-gradient(ellipse_32%_38%_at_24%_56%,rgba(169,205,255,0.75),transparent),radial-gradient(ellipse_34%_40%_at_50%_46%,rgba(251,191,138,0.7),transparent),radial-gradient(ellipse_32%_38%_at_76%_54%,rgba(199,182,255,0.8),transparent)]" />

        {IDEA_CARDS.map((card, index) => (
          <div
            key={card.key}
            className={`animate-idea-deal absolute ${card.className}`}
            style={
              {
                '--deal-x': card.fromX,
                '--deal-rotate': card.rotate,
                '--deal-delay': card.delay,
              } as CSSProperties
            }
          >
            {/* 카드마다 박자가 다르게 떠 있다 */}
            <div
              className="animate-idea-float relative aspect-[172/258] overflow-hidden rounded-[20px] bg-[#14132b] shadow-[0_12px_24px_rgba(0,0,0,0.18)]"
              style={
                {
                  '--float-duration': `${3.6 + index * 0.5}s`,
                } as CSSProperties
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- 작은 장식 그림이라 이미지 최적화가 할 일이 없다 */}
              <img
                src={card.src}
                alt=""
                className="size-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-x-0 bottom-0 h-[58%] bg-linear-to-b from-black/0 to-black/75" />
              <p className="absolute inset-x-3 bottom-3 text-sm leading-[1.3] font-bold break-keep text-white">
                {t.rich(card.key, lineBreak)}
              </p>
            </div>
          </div>
        ))}

        {SPARKLES.map((sparkle) => (
          <span
            key={sparkle.className}
            className={`animate-sparkle-twinkle absolute inline-block ${sparkle.className}`}
          >
            <GradientSparkle size={sparkle.size} />
          </span>
        ))}
      </div>

      <h2 className="mt-4 text-center text-2xl leading-[1.33] font-bold break-keep text-foreground">
        {t.rich('emptyTitle', lineBreak)}
      </h2>
      <p className="mt-2.5 text-center text-15 leading-normal break-keep text-muted-foreground">
        {t.rich('emptyDescription', lineBreak)}
      </p>
    </div>
  );
};
