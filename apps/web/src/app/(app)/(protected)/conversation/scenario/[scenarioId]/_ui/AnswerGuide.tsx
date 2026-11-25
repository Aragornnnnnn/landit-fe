// 답변 가이드 — 대화 칸에서 내 다음 말이 올 자리(오른쪽 아래)에 「✦ 예시 볼래요」 알약으로 서고, 누르면 그 자리에서 예시 카드로 커진다.
// 알약과 카드는 같은 layoutId라 화면에선 한 물건이 모양만 바꾼다. 말하기 시작하면 내 말풍선이 그 아래에 붙어 예시를 보며 말할 수 있다.
// 움직임 줄이기면 모양 변화 없이 바로 바뀐다
'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { useChatScroll } from '@/features/conversation/ui/flow/ConversationLog';
import type { AnswerGuide as AnswerGuideContent } from '@/features/scenario/api/daily';
import { DURATION, EASE_STANDARD } from '@/shared/motion';
import { GradientSparkle, SPARKLE_COLORS } from '@/shared/ui/GradientSparkle';
import { ChevronDownIcon } from '@/shared/ui/Icons';

// 흰 안쪽 + 그라데이션 테두리. border-image는 둥근 모서리를 못 따라가서 배경 두 겹으로 그린다
const gradientBorder = {
  background: `linear-gradient(var(--color-card), var(--color-card)) padding-box, linear-gradient(100deg, ${SPARKLE_COLORS.join(', ')}) border-box`,
  borderColor: 'transparent',
};

// 알약과 카드를 한 물건으로 잇는 이름
const GUIDE_LAYOUT_ID = 'answer-guide';

// 알약↔카드 모양 변화 — 살짝만 넘치고 멈추는 스프링
const MORPH = { type: 'spring', stiffness: 420, damping: 34 } as const;

// 모양 변화가 대략 자리 잡는 시간(초) — 알약·카드 안쪽 글자는 이 뒤에 나타나야 늘어난 채 보이지 않는다
const MORPH_SETTLE_S = 0.25;

// 알약이 바닥에서 살짝 떠 보이는 그림자
const PILL_SHADOW = '0 3px 10px rgba(0,0,0,0.06)';
// 첫 질문에서 눌러 보라고 알약 둘레에 번지는 옅은 보라 빛 — 반짝이·테두리의 보라와 같은 색
const HINT_GLOW = `${PILL_SHADOW}, 0 0 14px ${SPARKLE_COLORS[2]}2e`;

/**
 * 대화 칸의 답변 가이드 — 접혀 있으면 알약, 펼치면 예시 카드.
 * 유도(hintVisible)가 켜지면 알약 둘레에 보라 빛이 번져 처음 막힌 사람의 눈에 걸리게 한다
 */
export const AnswerGuide = ({
  guide,
  open,
  onOpen,
  onClose,
  hintVisible,
  chipRef,
}: {
  guide: AnswerGuideContent;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  hintVisible: boolean;
  // 카드를 접은 뒤 포커스를 돌려받을 자리
  chipRef?: React.Ref<HTMLButtonElement>;
}) => (
  // 바뀌는 순간 빠지는 쪽을 제자리에 띄워 둔다(popLayout) — 그 기준이 되는 틀이라 relative다
  <div className="relative flex flex-col">
    <AnimatePresence initial={false} mode="popLayout">
      {open ? (
        <AnswerGuideCard key="card" guide={guide} onClose={onClose} />
      ) : (
        <AnswerGuideChip
          key="pill"
          ref={chipRef}
          onOpen={onOpen}
          hintVisible={hintVisible}
        />
      )}
    </AnimatePresence>
  </div>
);

const AnswerGuideChip = ({
  onOpen,
  hintVisible,
  ref,
}: {
  onOpen: () => void;
  hintVisible: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}) => {
  const t = useTranslations('conversation.answerGuideChip');
  const reduced = useReducedMotion() ?? false;
  return (
    <motion.button
      ref={ref}
      layoutId={GUIDE_LAYOUT_ID}
      // 알약은 접을 때만 새로 붙는다 — 카드 크기에서 천천히 줄어들면 사라진 카드 자리가 빈 채 남아 보인다.
      // 접을 땐 바로 제 크기로 돌아오고, 펼칠 때의 커지는 모양은 카드 쪽 전환이 맡는다
      transition={{ duration: 0 }}
      onClick={onOpen}
      className="flex items-center gap-1.5 self-end border py-2 pr-3.5 pl-3 text-14 font-medium text-foreground transition-shadow active:scale-95"
      style={{
        ...gradientBorder,
        // 높이의 절반쯤 — 999로 두면 카드로 커지는 동안 알약처럼 부푼다
        borderRadius: 20,
        boxShadow: hintVisible ? HINT_GLOW : PILL_SHADOW,
      }}
    >
      {/* 접혀 돌아오면 글자도 바로 보인다 — 카드가 빠지는 0.12초와 겹쳐 살짝 떠오른다 */}
      <motion.span
        className="flex items-center gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.15 }}
      >
        <GradientSparkle size={13} />
        {t('openButton')}
      </motion.span>
    </motion.button>
  );
};

const AnswerGuideCard = ({
  guide,
  onClose,
}: {
  guide: AnswerGuideContent;
  onClose: () => void;
}) => {
  const t = useTranslations('conversation.answerGuideCard');
  const reduced = useReducedMotion() ?? false;
  // 칩이 카드 크기로 커진 뒤에 안쪽이 차례로 올라온다
  const settle = reduced ? 0 : MORPH_SETTLE_S;
  const line = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 6 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: DURATION.base,
      ease: EASE_STANDARD,
      delay: settle + delay,
    },
  });

  // 칩이 카드로 바뀌며 사라지므로 포커스를 카드 안(접기)으로 옮긴다 — 키보드·화면 읽기 사용자가 자리를 잃지 않게
  const closeRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const scroll = useChatScroll();
  // 칩이 카드로 다 커진 뒤에 한다 — 펼치는 첫 프레임에 포커스까지 얹으면 화면 계산이 겹쳐 버벅인다.
  // 커진 카드가 칸 아래로 넘치면 접기 버튼까지 보이게 칸에 따라 내려와 달라고 한다
  useEffect(() => {
    const timer = setTimeout(() => {
      if (cardRef.current) scroll?.follow(cardRef.current);
      closeRef.current?.focus({ preventScroll: true });
    }, MORPH_SETTLE_S * 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 펼친 순간 한 번만. scroll은 렌더마다 새 객체다
  }, []);

  return (
    <motion.div
      ref={cardRef}
      layoutId={GUIDE_LAYOUT_ID}
      transition={reduced ? { duration: 0 } : MORPH}
      // 접을 때는 줄어드는 칩에 자리를 넘기며 재빨리 사라진다.
      // 사라지는 도중 다시 펼치면 같은 카드가 되살아나므로 투명도를 1로 되돌릴 목표가 있어야 한다 — 없으면 투명한 채 멈춘다
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      role="region"
      aria-label={t('regionLabel')}
      // 상대 말풍선과 짝을 이루는 오른쪽 말풍선 모양 — 오른위 꼬리, 내 다음 말이 올 자리에 선다
      className="relative flex w-[280px] max-w-full flex-col self-end border px-[18px] pt-3.5 pb-3 shadow-[0_8px_12px_rgba(0,0,0,0.09)]"
      style={{ ...gradientBorder, borderRadius: '20px 6px 20px 20px' }}
    >
      {!reduced && <span className="animate-guide-sweep" aria-hidden="true" />}
      <motion.div className="flex items-center gap-[5px]" {...line(0)}>
        {/* 반짝이가 톡 튀어나와 "도움이 왔다"를 알린다 */}
        <motion.span
          className="flex"
          initial={reduced ? false : { scale: 0, rotate: -90 }}
          animate={reduced ? undefined : { scale: [0, 1.35, 1], rotate: 0 }}
          transition={{ duration: 0.5, ease: EASE_STANDARD, delay: settle }}
        >
          <GradientSparkle size={14} />
        </motion.span>
        <p className="text-12 font-bold text-foreground">{t('title')}</p>
      </motion.div>
      {/* 예시가 뜻보다 먼저 — 영어를 먼저 읽게 한 박자 늦춰 따라온다 */}
      <motion.p
        {...line(0.08)}
        className="mt-1.5 text-16 leading-[1.45] font-bold break-words text-foreground"
      >
        {guide.content}
      </motion.p>
      <motion.p
        {...line(0.16)}
        className="mt-1.5 text-13 leading-normal break-words text-muted-foreground"
      >
        {guide.translatedContent}
      </motion.p>
      <motion.div className="mt-1.5 flex justify-end" {...line(0.16)}>
        <button
          ref={closeRef}
          onClick={onClose}
          className="-my-1 -mr-1 flex items-center gap-0.5 px-1 py-1 text-12 font-bold text-muted-foreground active:opacity-70"
        >
          {t('closeButton')}
          <ChevronDownIcon size={14} strokeWidth={2.5} className="rotate-180" />
        </button>
      </motion.div>
    </motion.div>
  );
};
