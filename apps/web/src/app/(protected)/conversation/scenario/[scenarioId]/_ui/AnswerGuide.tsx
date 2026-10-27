// 답변 가이드 — 내 답변 칸 오른쪽 위 칩이 그 자리에서 예시 카드로 커지고, 접으면 다시 칩으로 줄어든다.
// 칩과 카드는 같은 layoutId라 화면에선 한 물건이 모양만 바꾼다. 답변 칸은 그대로 두고 카드를 그 위에 겹쳐서,
// 여닫을 때 답변 칸이 다시 그려지거나 위 질문 카드가 밀리지 않는다. 움직임 줄이기면 모양 변화 없이 바로 바뀐다
'use client';

import { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import type { AnswerGuide } from '@/features/scenario/api/daily';
import { DURATION, EASE_STANDARD } from '@/shared/motion';
import { ChevronDownIcon } from '@/shared/ui/Icons';

// 주황(브랜드)에서 분홍·보라로 — 반짝이 아이콘과 테두리가 같은 세 색을 쓴다
const GUIDE_COLORS = ['#f2994a', '#ec6a8c', '#8b6cf0'] as const;

// 흰 안쪽 + 그라데이션 테두리. border-image는 둥근 모서리를 못 따라가서 배경 두 겹으로 그린다
const gradientBorder = {
  background: `linear-gradient(var(--color-card), var(--color-card)) padding-box, linear-gradient(100deg, ${GUIDE_COLORS.join(', ')}) border-box`,
  borderColor: 'transparent',
};

// 칩과 카드를 한 물건으로 잇는 이름
const GUIDE_LAYOUT_ID = 'answer-guide';

// 칩↔카드 모양 변화 — 살짝만 넘치고 멈추는 스프링
const MORPH = { type: 'spring', stiffness: 420, damping: 34 } as const;

// 모양 변화가 대략 자리 잡는 시간(초) — 칩·카드 안쪽 글자는 이 뒤에 나타나야 늘어난 채 보이지 않는다
const MORPH_SETTLE_S = 0.25;

// 힌트가 떠 있는 동안 칩 둘레를 감싸는 옅은 보라 고리 — 반짝이·테두리의 보라와 같은 색
const HINT_RING = `0 0 0 4px ${GUIDE_COLORS[2]}33`;

// 네 꼭짓점 반짝이 — SparkleIcon과 같은 별을 그라데이션으로 칠한다
const GradientSparkle = ({ size }: { size: number }) => {
  // useId에는 url(#…) 참조를 깨는 문자가 섞일 수 있어 걸러 낸다
  const id = `guide-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="flex-none"
    >
      <defs>
        <linearGradient
          id={id}
          x1="2"
          y1="2"
          x2="22"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={GUIDE_COLORS[0]} />
          <stop offset="0.5" stopColor={GUIDE_COLORS[1]} />
          <stop offset="1" stopColor={GUIDE_COLORS[2]} />
        </linearGradient>
      </defs>
      <path
        d="M12 1.5q.9 9.6 10.5 10.5-9.6.9-10.5 10.5Q11.1 12.9 1.5 12q9.6-.9 10.5-10.5Z"
        fill={`url(#${id})`}
      />
    </svg>
  );
};

/** 내 답변 칸 머리에 붙는 칩 — 라벨 줄 높이를 키우지 않게 위아래를 끌어당긴다.
 * 유도 힌트가 켜지면 칩 아래(아직 비어 있는 답변 칸 안)에 "말이 안 떠오르면 눌러 봐요" 말풍선이 떠서 칩을 가리킨다.
 * 칩 위로 띄우면 작은 화면에서 질문 카드의 다시 듣기·해석 버튼을 가린다 */
export const AnswerGuideChip = ({
  onOpen,
  hintVisible,
  ref,
}: {
  onOpen: () => void;
  hintVisible: boolean;
  // 카드를 접은 뒤 포커스를 돌려받을 자리
  ref?: React.Ref<HTMLButtonElement>;
}) => {
  const reduced = useReducedMotion() ?? false;
  const hintId = `guide-hint-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    // 말풍선은 칩 버튼 밖 형제로 둔다 — 칩이 카드로 커지는 모양 변화에 같이 늘어나지 않게
    <span className="relative flex">
      <motion.button
        ref={ref}
        layoutId={GUIDE_LAYOUT_ID}
        transition={reduced ? { duration: 0 } : MORPH}
        onClick={onOpen}
        aria-describedby={hintVisible ? hintId : undefined}
        className="-my-1 flex h-6 items-center gap-1 border px-2.5 text-xs font-bold text-foreground transition-shadow active:scale-95"
        style={{
          ...gradientBorder,
          // 높이(24px)의 절반 — 999로 두면 카드로 커지는 동안 알약처럼 부푼다
          borderRadius: 12,
          boxShadow: hintVisible ? HINT_RING : undefined,
        }}
      >
        {/* 카드에서 줄어들어 돌아올 때 글자가 늘어난 채 보이지 않게, 모양이 자리 잡은 뒤 나타난다 */}
        <motion.span
          className="flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: reduced ? 0 : MORPH_SETTLE_S }}
        >
          <GradientSparkle size={12} />
          예시 볼래요
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {hintVisible && (
          <motion.span
            key="hint"
            id={hintId}
            initial={{ opacity: 0, y: reduced ? 0 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
            className="pointer-events-none absolute top-full right-0 z-10 mt-3 whitespace-nowrap"
          >
            {/* 살짝 떠다녀 눈에 걸리게 한다. 움직임 줄이기면 멈춘다 */}
            <motion.span
              className="relative block rounded-xl bg-foreground px-3 py-2 text-[13px] font-bold text-background shadow-lg shadow-black/15"
              animate={reduced ? undefined : { y: [0, -3, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              말이 안 떠오르면 눌러 봐요
              {/* 위쪽 칩 가운데를 가리키는 꼬리 — 칩 폭(약 92px)의 절반쯤에 둔다 */}
              <span className="absolute right-10 bottom-full border-x-[6px] border-b-[7px] border-x-transparent border-b-foreground" />
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};

/**
 * 내 답변 칸 자리 — 칸은 늘 그대로 두고, 펼치면 예시 카드를 그 위에 겹친다.
 * 카드는 칸의 아래 끝에 붙어 칸과 같은 최소 높이로 덮는다. 글이 길면 위로 자라 마이크를 가리지 않는다
 */
export const AnswerGuideSlot = ({
  guide,
  open,
  onClose,
  children,
}: {
  guide: AnswerGuide | null;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  // flex로 둬서 안쪽 답변 칸의 위 여백이 바깥으로 새지 않게 한다 — 카드가 칸 높이를 그대로 덮어야 한다
  <div className="relative flex min-h-0 shrink flex-col">
    {children}
    <AnimatePresence>
      {open && guide && (
        <AnswerGuideCard key="guide" guide={guide} onClose={onClose} />
      )}
    </AnimatePresence>
  </div>
);

const AnswerGuideCard = ({
  guide,
  onClose,
}: {
  guide: AnswerGuide;
  onClose: () => void;
}) => {
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
  // 칩이 카드로 다 커진 뒤에 옮긴다 — 펼치는 첫 프레임에 포커스까지 얹으면 화면 계산이 겹쳐 버벅인다
  useEffect(() => {
    const timer = setTimeout(
      () => closeRef.current?.focus({ preventScroll: true }),
      MORPH_SETTLE_S * 1000,
    );
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      layoutId={GUIDE_LAYOUT_ID}
      transition={reduced ? { duration: 0 } : MORPH}
      // 접을 때는 줄어드는 칩에 자리를 넘기며 재빨리 사라진다.
      // 사라지는 도중 다시 펼치면 같은 카드가 되살아나므로 투명도를 1로 되돌릴 목표가 있어야 한다 — 없으면 투명한 채 멈춘다
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      role="region"
      aria-label="답변 예시"
      className="absolute inset-x-0 bottom-0 z-10 flex min-h-28 flex-col border-[1.5px] px-5 py-3 shadow-lg shadow-black/5"
      style={{ ...gradientBorder, borderRadius: 16 }}
    >
      {!reduced && <span className="animate-guide-sweep" aria-hidden="true" />}
      <motion.div className="flex items-center gap-1.5" {...line(0)}>
        {/* 반짝이가 톡 튀어나와 "도움이 왔다"를 알린다 */}
        <motion.span
          className="flex"
          initial={reduced ? false : { scale: 0, rotate: -90 }}
          animate={reduced ? undefined : { scale: [0, 1.35, 1], rotate: 0 }}
          transition={{ duration: 0.5, ease: EASE_STANDARD, delay: settle }}
        >
          <GradientSparkle size={14} />
        </motion.span>
        <p className="flex-1 text-xs font-bold text-foreground">
          막막하면 이렇게 말해 봐요
        </p>
        <button
          ref={closeRef}
          onClick={onClose}
          className="-my-1 -mr-1 flex items-center gap-0.5 px-1 py-1 text-xs font-medium text-muted-foreground active:opacity-70"
        >
          접기
          <ChevronDownIcon size={12} strokeWidth={2.5} className="rotate-180" />
        </button>
      </motion.div>
      {/* 예시가 뜻보다 먼저 — 영어를 먼저 읽게 한 박자 늦춰 따라온다 */}
      <motion.p
        {...line(0.08)}
        className="mt-1.5 text-[17px] leading-snug font-bold text-foreground"
      >
        {guide.content}
      </motion.p>
      <motion.p
        {...line(0.16)}
        className="mt-1 text-sm leading-snug text-muted-foreground"
      >
        {guide.translatedContent}
      </motion.p>
    </motion.div>
  );
};
