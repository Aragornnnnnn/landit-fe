// 대화 상대 고르기 — 상반신 한 명이 무대에 서고, 좌우로 넘기거나 양옆 화살표로 바꾼다. 보이는 캐릭터가 곧 선택이다
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { PartnerBust } from '@/features/roleplay/ui/PartnerBust';
import { PARTNERS } from '@/features/small-talk/model/partner';
import { DURATION, EASE_STANDARD } from '@/shared/motion';
import { Emoji } from '@/shared/ui/emoji';
import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/ui/Icons';

interface PartnerCarouselProps {
  index: number;
  onShow: (index: number) => void;
}

// 이만큼 끌어야 다음 사람으로 넘어간다 — 세로 스크롤하려다 살짝 밀린 건 무시한다
const SWIPE_PX = 50;

const ARROW_CLASS =
  'absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[0_4px_10px_rgba(0,0,0,0.06)] active:scale-95 disabled:opacity-30';

export const PartnerCarousel = ({ index, onShow }: PartnerCarouselProps) => {
  const t = useTranslations('roleplay');
  const reduced = useReducedMotion();
  const partner = PARTNERS[index];
  const isFirst = index === 0;
  const isLast = index === PARTNERS.length - 1;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[400px] w-full">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={partner.id}
            className="absolute inset-x-0 bottom-0 flex touch-pan-y justify-center"
            initial={{ opacity: 0, x: reduced ? 0 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduced ? 0 : -40 }}
            transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
            drag={reduced ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDragEnd={(_, info) => {
              if (info.offset.x < -SWIPE_PX) onShow(index + 1);
              else if (info.offset.x > SWIPE_PX) onShow(index - 1);
            }}
          >
            {/* 좁은 폰(320px)에선 양옆 화살표(44px) 자리를 비워 둔다 */}
            <PartnerBust
              partner={partner.id}
              className="w-[min(250px,calc(100%-104px))]"
            />
          </motion.div>
        </AnimatePresence>
        {/* 끝에선 화살표가 흐려진다 — 순환하지 않으니 더 넘어갈 곳이 없다 */}
        <button
          type="button"
          onClick={() => onShow(index - 1)}
          disabled={isFirst}
          aria-label={t('create.previousLabel')}
          className={`${ARROW_CLASS} left-0`}
        >
          <ChevronLeftIcon size={22} />
        </button>
        <button
          type="button"
          onClick={() => onShow(index + 1)}
          disabled={isLast}
          aria-label={t('create.nextLabel')}
          className={`${ARROW_CLASS} right-0`}
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
