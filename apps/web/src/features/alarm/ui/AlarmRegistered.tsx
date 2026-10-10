'use client';

// 알람 등록 완료 — 다짐 문장이 위에서 내려와 가운데 자리 잡고, "저는 … 하겠습니다!"가 "매일 … 알려드릴게요!"로 바뀐다. 알아볼 만큼만 보여 주고 저절로 넘어간다.
// 권한을 거절했으면 등록은 저장돼 있지만 아직 안 울린다 — 다짐 직후가 켤 마음이 가장 큰 순간이라 「지금 켜기」를 한 번 더 건넨다.
// 켜고 돌아오면 상태가 바뀌어 그대로 완료 연출로 이어진다
import { useEffect, useRef, useState } from 'react';
import type { AlarmTime } from '@landit/bridge';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { haptic } from '@/shared/haptics';
import { EASE_STANDARD } from '@/shared/motion';
import { Button } from '@/shared/ui/Button';

import { ALARM_COPY } from '../model/alarm-copy';
import { formatAlarmTime } from '../model/alarm-time';
import { PledgeSentence, TimeChip } from './PledgeSentence';

// 한 단계씩 차례로 — 문장이 내려오고(0.6초) 읽을 틈을 둔 뒤 "하겠습니다"가 "알려드릴게요"로 바뀌고,
// 바뀐 문장이 자리 잡은 다음 체크와 "등록이 완료되었어요"가 나타난다. 다 보이고도 잠시 머문 뒤 넘어간다
const DROP_S = 0.6;
const SWAP_AT_MS = 800;
const CONFIRM_AT_MS = 1300;
const LEAVE_AFTER_MS = 3800;
const SHIFT = { duration: 0.5, ease: EASE_STANDARD };
const RISE = { type: 'spring', stiffness: 300, damping: 26 } as const;

type Phase = 'pledge' | 'swapped' | 'confirmed';

// 주황 동그라미가 부드럽게 커지고 안에서 체크가 그려진다
const CheckMark = ({ shown }: { shown: boolean }) => (
  <motion.svg
    viewBox="0 0 32 32"
    className="size-8"
    initial={false}
    animate={shown ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
    aria-hidden
  >
    <circle cx="16" cy="16" r="16" className="fill-primary" />
    <motion.path
      d="M9.5 16.5l4.5 4.5 8.5-9"
      fill="none"
      stroke="white"
      strokeWidth={3.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={false}
      animate={{ pathLength: shown ? 1 : 0 }}
      transition={{ delay: shown ? 0.15 : 0, duration: 0.35, ease: 'easeOut' }}
    />
  </motion.svg>
);

const Completed = ({
  time,
  onDone,
}: {
  time: AlarmTime;
  onDone: () => void;
}) => {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(reduced ? 'confirmed' : 'pledge');
  // 부모가 다시 그려져(알람 상태 회신 등) onDone이 바뀌어도 넘어갈 시계를 처음부터 다시 재지 않는다
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('swapped'), reduced ? 0 : SWAP_AT_MS),
      setTimeout(
        () => {
          setPhase('confirmed');
          haptic('success');
        },
        reduced ? 0 : CONFIRM_AT_MS,
      ),
      setTimeout(() => onDoneRef.current(), LEAVE_AFTER_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  const swapped = phase !== 'pledge';
  const confirmed = phase === 'confirmed';

  return (
    <main className="flex h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <motion.div
        initial={reduced ? false : { y: '-32vh' }}
        animate={{ y: 0 }}
        transition={{ duration: DROP_S, ease: EASE_STANDARD }}
        className="flex flex-col items-center"
      >
        <div className="mb-4 flex flex-col items-center gap-2">
          <CheckMark shown={confirmed} />
          <motion.p
            className="text-[15px] font-bold text-primary"
            initial={false}
            animate={confirmed ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{ ...SHIFT, delay: confirmed ? 0.2 : 0 }}
          >
            등록이 완료되었어요
          </motion.p>
        </div>
        <p className="text-[26px] leading-snug font-black text-foreground">
          <motion.span
            layout
            transition={SHIFT}
            className="relative inline-flex items-baseline gap-[0.25em]"
          >
            <AnimatePresence initial={false} mode="popLayout">
              {!swapped && (
                <motion.span
                  key="me"
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  저는
                </motion.span>
              )}
            </AnimatePresence>
            <motion.span layout transition={SHIFT}>
              매일
            </motion.span>
            <motion.span layout transition={SHIFT}>
              <TimeChip time={time} />에
            </motion.span>
          </motion.span>
          <br />
          {/* 둘째 줄은 옛 글자가 위로 빠진 뒤 새 글자가 아래에서 올라온다 — 겹치지 않게 차례로 */}
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              key={swapped ? 'after' : 'before'}
              className="inline-block whitespace-pre-line"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: RISE }}
              exit={{
                y: -16,
                opacity: 0,
                transition: { duration: 0.22, ease: 'easeIn' },
              }}
            >
              {swapped ? '알려드릴게요!' : ALARM_COPY.pledgeClosing}
            </motion.span>
          </AnimatePresence>
        </p>
      </motion.div>
    </main>
  );
};

const NeedsPermission = ({
  time,
  onUnblock,
  onLater,
}: {
  time: AlarmTime;
  onUnblock: () => void;
  onLater: () => void;
}) => (
  <main className="flex h-dvh flex-col bg-background">
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="text-[26px] leading-snug font-black text-foreground">
        <PledgeSentence time={time} />
      </p>
      <p className="mt-8 text-[18px] font-bold text-foreground">
        거의 다 됐어요!
      </p>
      <p className="mt-1.5 text-[15px] font-medium text-muted-foreground">
        권한만 켜면 매일 {formatAlarmTime(time)}에 알려드릴게요
      </p>
    </div>
    <div className="px-6 pb-[max(var(--safe-area-inset-bottom),24px)]">
      <Button onClick={onUnblock}>지금 켜기</Button>
      <button
        type="button"
        onClick={onLater}
        className="mt-4 w-full text-center text-[13px] font-bold text-muted-foreground"
      >
        나중에 할게요
      </button>
    </div>
  </main>
);

export const AlarmRegistered = ({
  time,
  blocked,
  onUnblock,
  onDone,
}: {
  time: AlarmTime;
  blocked: boolean;
  onUnblock: () => void;
  onDone: () => void;
}) =>
  blocked ? (
    <NeedsPermission time={time} onUnblock={onUnblock} onLater={onDone} />
  ) : (
    <Completed time={time} onDone={onDone} />
  );
