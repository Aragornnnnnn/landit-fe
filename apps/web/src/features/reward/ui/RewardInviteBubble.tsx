'use client';

// 헤더 알약 아래의 말풍선 — 알약이 「N원 받으러 가기」로 바뀐 까닭을 한 번만 말한다. 스스로 닫히지 않고, 화면 어디를 눌러도 닫힌다
import { motion } from 'motion/react';
import { createPortal } from 'react-dom';

import { formatWon } from '@/shared/lib/won';

// 알약 아래로 띄우는 간격과, 꼬리가 알약 왼쪽에서 떨어진 자리
const GAP = 12;
const TAIL_LEFT = 24;

export const RewardInviteBubble = ({
  pill,
  amountWon,
  onClose,
}: {
  // 헤더 알약의 화면 자리
  pill: { left: number; top: number; height: number };
  amountWon: number;
  onClose: () => void;
}) =>
  createPortal(
    // 동전 연출의 어둠(z-70)보다 위에 둔다 — 어둠이 걷히기 전에 뜨고, 걷힌 뒤에도 그대로 남는다
    <div className="fixed inset-0 z-[71]">
      <button
        type="button"
        aria-label="안내 닫기"
        className="absolute inset-0"
        onClick={onClose}
      />
      <motion.div
        role="status"
        className="pointer-events-none absolute rounded-2xl bg-card px-4 py-3 text-[14px] leading-[1.45] font-bold text-foreground shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
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
        챌린지를 시작하면
        <br />
        대화할 때마다{' '}
        <span className="text-primary">{formatWon(amountWon)}</span>씩 쌓여요
      </motion.div>
    </div>,
    document.body,
  );
