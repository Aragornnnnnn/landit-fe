// 공통 / 설치 유도 — 홈 화면 목업 위에 위젯 카드가 떠오르며 설치를 청한다
'use client';

import { motion, useReducedMotion } from 'motion/react';

import { WidgetPreviewSmall } from '@/features/widget/ui/WidgetPreviewCard';

import { GuideScaffold, PhoneMockup } from './GuideScaffold';

// 홈 화면 앱 자리들 — [left, top]. 위젯 카드가 들어갈 왼쪽 위는 비워져 있다
const APP_SLOTS = [
  [186, 30],
  [186, 106],
  [24, 200],
  [105, 200],
  [186, 200],
] as const;

export const InviteStep = ({
  onAdd,
  onLater,
}: {
  onAdd: () => void;
  onLater: () => void;
}) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <GuideScaffold
      title={
        <>
          홈 화면에서
          <br />
          래디와 매일 만나요
        </>
      }
      subtitle="앱을 열지 않아도 며칠째인지 보여요"
      cta="위젯 추가하기"
      onCta={onAdd}
      onLater={onLater}
    >
      <PhoneMockup>
        {APP_SLOTS.map(([left, top]) => (
          <div
            key={`${left}-${top}`}
            className="absolute size-[52px] rounded-[14px] bg-white/55"
            style={{ left, top }}
          />
        ))}
        {/* 위젯 카드가 아래에서 8px 떠오르며 페이드인 — 홈에 "새로 놓이는" 감각 */}
        <motion.div
          className="absolute top-[30px] left-[24px]"
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <WidgetPreviewSmall />
        </motion.div>
        <div className="absolute bottom-0 left-0 h-[160px] w-full bg-gradient-to-b from-transparent to-[#f4f9ff]" />
      </PhoneMockup>
    </GuideScaffold>
  );
};
