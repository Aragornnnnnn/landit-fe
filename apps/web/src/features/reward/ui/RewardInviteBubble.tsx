'use client';

// 헤더 알약 아래의 말풍선 — 알약이 「N원 받으러 가기」로 바뀐 까닭을 한 번만 말한다. 놓친 금액을 말하는 알약이면 오늘 몫은 아직 받을 수 있다고 권한다.
// 스스로 닫히지 않고, 화면 어디를 눌러도 닫힌다
import { useEffect, useEffectEvent } from 'react';
import { motion } from 'motion/react';
import { createPortal } from 'react-dom';

import { formatWon } from '@/shared/lib/won';

// 알약 아래로 띄우는 간격과, 꼬리가 알약 왼쪽에서 떨어진 자리
const GAP = 12;
const TAIL_LEFT = 24;

export const RewardInviteBubble = ({
  pill,
  amountWon,
  missed = false,
  onClose,
}: {
  // 헤더 알약의 화면 자리
  pill: { left: number; top: number; height: number };
  amountWon: number;
  // 알약이 놓친 금액을 말하는 중인가
  missed?: boolean;
  onClose: () => void;
}) => {
  // 화면을 덮지 않는다 — 덮으면 말풍선이 가리키는 알약의 첫 누름까지 먹는다. 어디를 누르든 그 누름은 그대로 가고 말풍선만 닫힌다
  const close = useEffectEvent(onClose);
  useEffect(() => {
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  return createPortal(
    <motion.div
      role="status"
      // 동전 연출의 어둠(z-70)보다 위에 둔다 — 어둠이 걷히기 전에 뜨고, 걷힌 뒤에도 그대로 남는다
      className="pointer-events-none fixed z-[71] rounded-2xl bg-card px-4 py-3 text-[14px] leading-[1.45] font-bold text-foreground shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
      style={{ left: pill.left, top: pill.top + pill.height + GAP }}
      initial={{ opacity: 0, y: -6, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
    >
      <span
        aria-hidden
        className="absolute -top-1.5 size-3 rotate-45 bg-card"
        style={{ left: TAIL_LEFT }}
      />
      {missed ? (
        <>
          오늘 <span className="text-primary">{formatWon(amountWon)}</span>은
          아직 받을 수 있어요
          <br />
          지금 시작해 보세요
        </>
      ) : (
        <>
          프리미엄을 시작하면
          <br />
          대화할 때마다{' '}
          <span className="text-primary">{formatWon(amountWon)}</span>씩 쌓여요
        </>
      )}
    </motion.div>,
    document.body,
  );
};
