// 첫 진입 안내 — 래디가 날아들어 여기가 어떤 곳인지 한 번 일러준다. 닫아야 상대가 인사를 시작한다.
// 누가 먼저 말을 거는지는 아래 버튼 두 개가 이미 말하고 있어서, 여기선 화면이 못 말해 주는 것만 남긴다
'use client';

import { motion } from 'motion/react';

import { Button } from '@/shared/ui/Button';

export const IntroGuide = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6">
    <motion.div
      className="absolute inset-0 bg-black/75"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    />

    {/* 오른쪽 아래에서 호를 그리며 날아든다 — 속마음 연출과 같은 등장이라 같은 인물로 읽힌다 */}
    <motion.div
      initial={{ x: 200, y: 130, rotate: 14, opacity: 0 }}
      animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 190, damping: 21 }}
      className="relative flex w-full flex-col items-center"
    >
      {/* 떠 있는 동안 둥실둥실 */}
      <motion.div
        animate={{ y: [0, -9, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/character/landy-genie.webp"
          alt="래디"
          className="object-contain"
          style={{ width: 172, height: 172 }}
        />
      </motion.div>

      {/* 닫는 버튼까지 말풍선 안에 담는다 — 말풍선 밖에 두면 래디의 말과 따로 노는 조각이 된다 */}
      <motion.div
        initial={{ scale: 0.7, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{
          delay: 0.24,
          type: 'spring',
          stiffness: 320,
          damping: 19,
        }}
        className="relative -mt-2 w-full rounded-3xl bg-card px-5 pt-5 pb-4 shadow-xl"
        role="status"
      >
        {/* 위쪽 꼬리 */}
        <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 rounded-[3px] bg-card" />
        {/* break-keep이 없으면 좁은 화면에서 "이에 / 요"로 갈린다 */}
        <p className="text-center text-base leading-relaxed font-bold break-keep text-primary">
          점수도 피드백도 없는 수다 시간이에요
        </p>
        {/* 규칙만 있으면 할 이유가 안 생긴다 — 왜 해볼 만한지를 먼저 말하고 규칙을 뒤에 붙인다.
            한도는 지금 모두에게 1분이라 문구에 박아 둔다 (사람마다 달라지면 topics 응답의
            dailySpeakingTimeLimitMs를 받아 쓰도록 바꾼다) */}
        <p className="mt-2 text-center text-sm leading-relaxed font-medium break-keep text-muted-foreground">
          외국에선 자주 있는 스몰톡, 매일 1분씩 드려요.
          <br />
          내가 말한 시간만큼만 줄어들어요.
        </p>
        <div className="mt-4">
          <Button size="md" onClick={onClose}>
            이해했어요
          </Button>
        </div>
      </motion.div>
    </motion.div>
  </div>
);
