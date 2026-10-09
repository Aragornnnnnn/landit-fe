'use client';

// 알람 소개 — 잠금화면에 이렇게 뜬다는 폰 그림과 "알람 시간 정하기". 폰은 띠용 튀어 오르며 바로 알람처럼 떨리고, 이따금 다시 떨린다.
// 마이페이지는 뒤로 가기로, 결제 직후는 「다음에 할게요」로 빠져나간다
import { motion, useReducedMotion } from 'motion/react';

import { BackHeader } from '@/shared/ui/BackHeader';
import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';

import { useAlarmCopy } from '../model/alarm-copy';
import styles from './AlarmIntro.module.css';
import {
  INTRO_PREVIEW_WIDTH,
  LockScreenPreview,
  useLockScreenPreview,
} from './LockScreenPreview';

export const AlarmIntro = ({
  onNext,
  onBack,
  onSkip,
}: {
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}) => {
  const reduced = useReducedMotion();
  const copy = useAlarmCopy();
  const { ratio, buttonTop } = useLockScreenPreview();

  return (
    <main className="flex h-dvh flex-col bg-background">
      {onBack ? (
        <BackHeader onBack={onBack} />
      ) : (
        <div className="pt-[max(var(--safe-area-inset-top),16px)]" />
      )}
      <h1 className="px-6 pt-4 text-[25px] leading-tight font-black whitespace-pre-line text-foreground">
        {copy.introTitle}
      </h1>

      <div className="flex min-h-0 flex-1 items-center justify-center py-3">
        {/* 화면이 짧으면 그림이 높이에 맞춰 준다 */}
        <motion.div
          className="relative h-full max-h-[515px] max-w-full"
          style={{ aspectRatio: `1 / ${ratio}` }}
          // 들어오자마자 아래에서 띠용 튀어 오른다
          initial={reduced ? false : { y: 140, scale: 0.88, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 15,
            opacity: { duration: 0.2 },
          }}
        >
          <div className={`size-full ${styles.ringing}`}>
            <LockScreenPreview
              width={INTRO_PREVIEW_WIDTH}
              className="size-full object-contain"
            />
          </div>
          {/* 그림 속 "대화하러 가기" 바로 위에 붙어 꼬리와 손가락이 버튼을 가리킨다 — 그림 기준 비율이라 폰 크기와 상관없이 맞는다 */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: `calc(${(1 - buttonTop) * 100}% + 7px)` }}
          >
            <p className="relative flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2.5 text-[13px] font-bold whitespace-nowrap text-foreground shadow-md">
              <Emoji>👇</Emoji>누르면 바로 오늘의 시나리오 시작!
            </p>
            <span
              aria-hidden
              className="absolute -bottom-[5px] left-1/2 size-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-white"
            />
          </div>
        </motion.div>
      </div>

      <div className="px-6 pt-2 pb-[max(var(--safe-area-inset-bottom),24px)]">
        <Button onClick={onNext}>알람 시간 정하기</Button>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="mt-4 w-full text-center text-[13px] font-bold text-muted-foreground"
          >
            다음에 할게요
          </button>
        )}
      </div>
    </main>
  );
};
