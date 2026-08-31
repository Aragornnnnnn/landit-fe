// 알림이 도착한 잠금화면 목업 — 알림이 방금 도착한 듯 카드가 내려앉는다 (피그마 874:157)
'use client';

import { motion, useReducedMotion } from 'motion/react';

export const LockScreenMockup = ({
  title = '오늘만 가능한 시나리오 도착 💌',
  body = '자기 전 5분으로 래디에게 열매를 먹여주세요',
}: {
  title?: string;
  body?: string;
}) => {
  const reduced = useReducedMotion();
  return (
    <div className="relative w-full max-w-[342px]">
      <div className="relative h-[295px] w-full overflow-hidden rounded-[32px] bg-linear-to-b from-[#2e2621] to-[#12110f]">
        {/* 다이내믹 아일랜드 */}
        <div className="absolute top-[13px] left-1/2 h-6 w-[88px] -translate-x-1/2 rounded-full bg-[#0a0a0a]" />

        <p className="pt-[50px] text-center text-[13px] font-medium text-white/20">
          7월 28일 화요일
        </p>
        <p className="text-center text-[40px] leading-[48px] font-semibold text-white/20">
          8:00
        </p>

        {/* 푸시 알림 미리보기 카드 — 잠금화면이 뜬 뒤 위에서 스프링으로 내려앉는 도착 연출 */}
        <motion.div
          initial={{
            opacity: 0,
            y: reduced ? 0 : -44,
            scale: reduced ? 1 : 0.94,
          }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.4,
            type: 'spring',
            stiffness: 380,
            damping: 26,
          }}
          className="absolute inset-x-5 top-[160px] rounded-[22px] bg-white px-3.5 pt-[13px] pb-[15px] shadow-[0px_10px_28px_-8px_rgba(0,0,0,0.28)]"
        >
          <div className="flex items-center gap-1.5">
            {/* 실제 알림처럼 앱 아이콘을 함께 보여준다 */}
            {/* eslint-disable-next-line @next/next/no-img-element -- 목업 소품이라 next/image 최적화가 불필요 */}
            <img
              src="/brand/app-icon.png"
              alt=""
              className="h-4 w-4 rounded-[4.5px]"
            />
            <span className="text-[13px] font-bold text-[#6b7280]">Landit</span>
            <span className="flex-1 text-right text-xs text-[#6b7280]">
              지금
            </span>
          </div>
          <p className="mt-1 text-[15px] leading-[21px] font-bold text-[#111]">
            {title}
          </p>
          <p className="mt-1 text-[13.5px] leading-[19px] text-[#6b7280]">
            {body}
          </p>
        </motion.div>
      </div>
    </div>
  );
};
