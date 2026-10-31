// 만든 시나리오가 없을 때 — 자극적인 상황 카드 두 장을 비스듬히 깔아 무엇을 만드는 곳인지 바로 보이게 한다
import { useTranslations } from 'next-intl';

import { lineBreak } from '@/shared/i18n/rich';
import { Emoji } from '@/shared/ui/emoji';
import { GradientSparkle } from '@/shared/ui/GradientSparkle';

// 그림과 글이 짝이다 — 위치와 각도는 시안 좌표 그대로다(390px 무대 기준, 왼쪽 위 모서리를 축으로 돌린다).
// 축을 가운데로 두면 돌아간 모서리가 무대 밖으로 나가 좁은 폰에서 잘린다
const IDEA_CARDS = [
  {
    key: 'presidentIdeaLabel',
    emoji: '🇺🇸',
    src: '/images/roleplay/idea-president.webp',
    className: 'left-[0.77%] top-[52px] -rotate-[8deg]',
  },
  {
    key: 'alienIdeaLabel',
    emoji: '👽',
    src: '/images/roleplay/idea-alien.webp',
    className: 'left-[55.64%] top-[36px] rotate-[8deg]',
  },
] as const;

export const RoleplayEmpty = () => {
  const t = useTranslations('roleplay.home');

  return (
    <div className="flex flex-col items-center pt-4">
      {/* 카드 뒤 색 번짐은 장식이다 — 무대 밖으로 번져도 잘리지 않게 overflow를 열어 둔다 */}
      <div className="relative h-[340px] w-full max-w-[390px]" aria-hidden>
        <div className="absolute top-[200px] left-[28%] h-[200px] w-[240px] rounded-full bg-[#a9cdff] opacity-80 blur-[55px]" />
        <div className="absolute top-[90px] -left-[13%] h-[220px] w-[280px] rounded-full bg-[#c7b6ff] opacity-90 blur-[55px]" />
        <div className="absolute top-0 left-[38%] h-[240px] w-[300px] rounded-full bg-[#fbbf8a] blur-[55px]" />

        {IDEA_CARDS.map((card) => (
          <div
            key={card.key}
            className={`absolute aspect-[172/258] w-[44.1%] max-w-[172px] origin-top-left overflow-hidden rounded-[20px] shadow-[0_12px_24px_rgba(0,0,0,0.18)] ${card.className}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- 216px 장식 그림이라 이미지 최적화가 할 일이 없다 */}
            <img
              src={card.src}
              alt=""
              className="size-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-x-0 bottom-0 h-[142px] bg-linear-to-b from-black/0 to-black/75" />
            <p className="absolute inset-x-3.5 bottom-3.5 flex gap-1.5 text-base leading-[1.3] font-bold break-keep text-white">
              <Emoji className="mt-0.5 flex-none">{card.emoji}</Emoji>
              <span>{t.rich(card.key, lineBreak)}</span>
            </p>
          </div>
        ))}

        <span className="absolute top-[22px] right-[17%]">
          <GradientSparkle size={22} />
        </span>
        <span className="absolute top-[36px] left-[14%]">
          <GradientSparkle size={14} />
        </span>
      </div>

      <h2 className="mt-7 text-center text-2xl leading-[1.33] font-bold break-keep text-foreground">
        {t.rich('emptyTitle', lineBreak)}
      </h2>
      <p className="mt-2.5 text-center text-15 leading-normal break-keep text-muted-foreground">
        {t.rich('emptyDescription', lineBreak)}
      </p>
    </div>
  );
};
