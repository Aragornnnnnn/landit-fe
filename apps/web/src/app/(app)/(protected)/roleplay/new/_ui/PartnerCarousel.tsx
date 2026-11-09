// 대화 상대 고르기 — 상반신 한 명이 무대에 서고, 좌우로 넘기거나 양옆 화살표로 바꾼다. 끝이 없고, 보이는 캐릭터가 곧 선택이다.
// 세 명을 미리 그려 두고 한 줄로 미끄러진다 — 겹치지 않아 잔상이 없고, 무거운 SVG를 다시 그리지 않으며, 움직임은 컴포지터가 맡는다
import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { PartnerBust } from '@/features/roleplay/ui/PartnerBust';
import { PARTNERS } from '@/features/small-talk/model/partner';
import { haptic } from '@/shared/haptics';
import { EASE_STANDARD } from '@/shared/motion';
import { Emoji } from '@/shared/ui/emoji';
import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/ui/Icons';

import { toCarouselSlot } from '../_model/partner-carousel';

interface PartnerCarouselProps {
  index: number;
  onMove: (step: -1 | 1) => void;
}

// 이만큼 끌어야 다음 사람으로 넘어간다 — 세로 스크롤하려다 살짝 밀린 건 무시한다
const SWIPE_PX = 50;
const SLIDE_EASE = `cubic-bezier(${EASE_STANDARD.join(',')})`;
const SLIDE_DURATION_S = 0.32;
const SLIDE_TRANSITION = `transform ${SLIDE_DURATION_S}s ${SLIDE_EASE}`;

// 화살표는 무대 가운데가 아니라 상반신 몸통 높이에 선다(시안 좌표)
const ARROW_CLASS =
  'absolute top-[200px] flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[0_4px_10px_rgba(0,0,0,0.06)] active:scale-95';

export const PartnerCarousel = ({ index, onMove }: PartnerCarouselProps) => {
  const t = useTranslations('roleplay');
  const reduced = useReducedMotion();
  const partner = PARTNERS[index];
  const swipeTo = (step: -1 | 1) => {
    haptic('tick');
    onMove(step);
  };
  // 왼쪽 끝과 오른쪽 끝을 오가는 사람은 무대를 가로지르지 않게 움직임 없이 옮긴다 — 직전 자리와 비교해 찾는다
  const [shown, setShown] = useState({ current: index, previous: index });
  if (shown.current !== index) {
    setShown({ current: index, previous: shown.current });
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative -mx-5 h-[400px] w-[calc(100%+40px)] overflow-hidden">
        <motion.div
          className="absolute inset-0 touch-pan-y"
          drag={reduced ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.5}
          onDragEnd={(_, info) => {
            // 넘어갈 만큼 끌었을 때만 다음 사람으로 넘기며 딸깍 — 화살표 버튼은 누름 진동이 이미 울린다
            if (info.offset.x < -SWIPE_PX) swipeTo(1);
            else if (info.offset.x > SWIPE_PX) swipeTo(-1);
          }}
        >
          {PARTNERS.map((item, itemIndex) => {
            const slot = toCarouselSlot(itemIndex, index, PARTNERS.length);
            const previousSlot = toCarouselSlot(
              itemIndex,
              shown.previous,
              PARTNERS.length,
            );
            const wraps = Math.abs(slot - previousSlot) > 1;
            return (
              <div
                key={item.id}
                aria-hidden={slot !== 0}
                className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center"
                style={{
                  transform: `translateX(${slot * 100}%)`,
                  transition: reduced || wraps ? 'none' : SLIDE_TRANSITION,
                }}
              >
                {/* 좁은 폰(320px)에선 양옆 화살표(44px) 자리를 비워 둔다 */}
                <PartnerBust
                  partner={item.id}
                  className="w-[min(250px,calc(100%-140px))]"
                />
              </div>
            );
          })}
        </motion.div>
        <button
          type="button"
          onClick={() => onMove(-1)}
          aria-label={t('create.previousLabel')}
          className={`${ARROW_CLASS} left-5`}
        >
          <ChevronLeftIcon size={22} />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          aria-label={t('create.nextLabel')}
          className={`${ARROW_CLASS} right-5`}
        >
          <ChevronRightIcon size={22} />
        </button>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-2xl font-bold text-foreground">
        {partner.name}
        <Emoji>{partner.flag}</Emoji>
      </p>
      <p className="mt-1 text-15 text-muted-foreground">
        {t(`partner.${partner.id}IntroDescription`)}
      </p>
    </div>
  );
};
