// iOS / 1 길게 누르기 — 빛 번짐이 퍼지고 아이콘들이 편집 모드로 흔들리기 시작한다
'use client';

import { motion, useReducedMotion } from 'motion/react';

import { GuideScaffold, PhoneMockup } from './GuideScaffold';

// 3×3 앱 자리 — [left, top]. 가운데 자리는 눌린 연출을 위해 따로 그린다
const APP_SLOTS = [
  [24, 62],
  [105, 62],
  [186, 62],
  [24, 143],
  [186, 143],
  [24, 224],
  [105, 224],
  [186, 224],
] as const;
const PRESSED_SLOT = [105, 143] as const;

// 빛 번짐이 다 퍼진 뒤에야 흔들림이 시작된다 — 길게 누름 → 편집 모드의 인과를 흉내 낸다
const GLOW_MS = 0.4;

// 흔들림 — 아이콘마다 시작을 조금씩 어긋나게 해 기계적으로 보이지 않게 한다 (20~60ms)
const wiggle = (index: number) => ({
  animate: { rotate: [-1.2, 1.2, -1.2] },
  transition: {
    duration: 0.28,
    repeat: Infinity,
    ease: 'easeInOut' as const,
    delay: GLOW_MS + 0.02 + (index % 5) * 0.01,
  },
});

// 편집 모드 장식(캡슐·삭제 배지)은 흔들림과 함께 나타난다
const editModeFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.2, delay: GLOW_MS },
};

const DeleteBadge = () => (
  <span className="absolute top-[-5px] left-[-5px] flex size-[16px] items-center justify-center rounded-full bg-[#c9d4e2]">
    <span className="h-[2px] w-[8px] rounded-[1px] bg-white" />
  </span>
);

export const PressStep = ({ onNext }: { onNext: () => void }) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <GuideScaffold
      title={
        <>
          홈 화면에서 아무곳이나
          <br />
          길게 눌러주세요
        </>
      }
      subtitle="아이콘이 흔들리면 준비 끝이에요"
      cta="다음"
      onCta={onNext}
    >
      <PhoneMockup>
        {/* 손가락이 누른 자리에서 빛이 퍼진다 */}
        <motion.div
          className="absolute top-[325px] left-[112px] h-[77px] w-[81px] rounded-full"
          style={{
            background:
              'radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(255,255,255,0.35) 55%, transparent)',
          }}
          initial={reduced ? false : { opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: GLOW_MS, ease: 'easeOut' }}
        />

        {APP_SLOTS.map(([left, top], index) => (
          <motion.div
            key={`${left}-${top}`}
            className="absolute size-[52px]"
            style={{ left, top }}
            {...(reduced ? {} : wiggle(index))}
          >
            <div className="size-full rounded-[13px] bg-white/75" />
            <motion.span {...(reduced ? {} : editModeFade)}>
              <DeleteBadge />
            </motion.span>
          </motion.div>
        ))}

        {/* 가운데 자리는 손끝에 눌려 있다 — 0.92로 작아지며 그림자가 진다 */}
        <motion.div
          className="absolute size-[52px] rounded-[13px] bg-white/95 shadow-[0_3px_10px_rgba(64,89,128,0.22)]"
          style={{ left: PRESSED_SLOT[0], top: PRESSED_SLOT[1] }}
          initial={reduced ? false : { scale: 1 }}
          animate={{ scale: 0.92 }}
          transition={{ duration: GLOW_MS, ease: 'easeOut' }}
        />

        <motion.div {...(reduced ? {} : editModeFade)}>
          <Capsule left={16}>편집</Capsule>
          <Capsule left={186}>완료</Capsule>
        </motion.div>
      </PhoneMockup>
    </GuideScaffold>
  );
};

// iOS 편집 모드의 좌우 캡슐 버튼
export const Capsule = ({
  left,
  highlight = false,
  children,
}: {
  left: number;
  highlight?: boolean;
  children: React.ReactNode;
}) => (
  <span
    className={`absolute top-[16px] rounded-[20px] border border-[#c9d4e2] px-4 py-1.5 text-[12px] font-bold whitespace-nowrap text-[#3c4654] ${
      highlight ? 'bg-white' : 'bg-white/90'
    }`}
    style={{ left }}
  >
    {children}
  </span>
);
