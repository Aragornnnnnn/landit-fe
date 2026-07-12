// 온보딩 스텝 전환 슬라이드 애니메이션 래퍼
'use client';

import { motion } from 'motion/react';

export const StepMotion = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.section
      className="flex min-h-0 flex-1 flex-col px-6"
      style={{
        paddingTop: 'calc(max(env(safe-area-inset-top), 18px) + 58px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
      }}
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -18 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
};
