// iOS / 1 길게 누르기 — 빈 공간을 길게 누르면(빛 번짐) 아이콘이 편집 모드로 흔들리기 시작한다.
// 실제 iOS처럼 앱이 아니라 빈 바닥을 누르고, 편집 장식은 누른 뒤에만 나타난다. 이 인과를 되풀이한다
'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

import {
  Capsule,
  GuideScaffold,
  PhoneMockup,
  TouchPulse,
} from './GuideScaffold';

// 3×3 앱 자리 — [left, top]. 편집 모드에서만 삭제 배지가 붙는다
const APP_SLOTS = [
  [24, 62],
  [105, 62],
  [186, 62],
  [24, 143],
  [105, 143],
  [186, 143],
  [24, 224],
  [105, 224],
  [186, 224],
] as const;

// 한 사이클의 세 국면 — 가만히 있다 → 빈 곳을 누르고 → 편집 모드로 흔들린다. 그리고 처음으로.
type Phase = 'idle' | 'pressing' | 'editing';
const PHASE_MS: Record<Phase, number> = {
  idle: 700,
  pressing: 1400,
  editing: 1800,
};
const NEXT_PHASE: Record<Phase, Phase> = {
  idle: 'pressing',
  pressing: 'editing',
  editing: 'idle',
};

const DeleteBadge = () => (
  <span className="absolute top-[-5px] left-[-5px] flex size-[16px] items-center justify-center rounded-full bg-[#c9d4e2]">
    <span className="h-[2px] w-[8px] rounded-[1px] bg-white" />
  </span>
);

export const PressStep = ({ onNext }: { onNext: () => void }) => {
  const reduced = useReducedMotion() ?? false;
  // reduced motion이면 사이클 없이 편집 모드 정지 화면으로 시작한다
  const [phase, setPhase] = useState<Phase>(reduced ? 'editing' : 'idle');

  // 국면을 시간에 따라 돌린다
  useEffect(() => {
    if (reduced) return;
    const timer = setTimeout(
      () => setPhase(NEXT_PHASE[phase]),
      PHASE_MS[phase],
    );
    return () => clearTimeout(timer);
  }, [phase, reduced]);

  const editing = phase === 'editing';

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
        {/* 손끝이 빈 바닥을 꾹 누른다 — 앱이 아니라 빈 곳이라야 편집 모드로 들어간다.
            주황 손끝과 물결로 "여기를 누르는 중"을 또렷이 보여준다 */}
        {phase === 'pressing' && <TouchPulse left={107} top={328} size={56} />}

        {APP_SLOTS.map(([left, top], index) => (
          <motion.div
            key={`${left}-${top}`}
            className="absolute size-[52px]"
            style={{ left, top }}
            // 편집 모드에서만 흔들린다 — 아이콘마다 시작을 어긋나게 해 기계적이지 않게
            animate={
              editing && !reduced
                ? { rotate: [-1.2, 1.2, -1.2] }
                : { rotate: 0 }
            }
            transition={
              editing && !reduced
                ? {
                    duration: 0.28,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: (index % 5) * 0.01,
                  }
                : { duration: 0.2 }
            }
          >
            <div className="size-full rounded-[13px] bg-white/75" />
            {/* 삭제 배지도 편집 모드에서만 — 누르기 전엔 평범한 홈 화면이다 */}
            <motion.span
              initial={false}
              animate={{ opacity: editing ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <DeleteBadge />
            </motion.span>
          </motion.div>
        ))}

        {/* 편집·완료 캡슐도 편집 모드에서만 나타난다 */}
        <motion.div
          initial={false}
          animate={{ opacity: editing ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Capsule left={16}>편집</Capsule>
          <Capsule left={186}>완료</Capsule>
        </motion.div>
      </PhoneMockup>
    </GuideScaffold>
  );
};
