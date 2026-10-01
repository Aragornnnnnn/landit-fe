'use client';

// 점수 트랙 — 원어민 이해도 %를 세며 마법사 래디가 그만큼 날아가 바를 채운다
// 숫자·바·캐릭터를 하나의 모션 값으로 굴려 이동 속도와 카운트업을 완전히 동기화한다.
import { useEffect, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';

// 트랙 위를 나는 래디 — 대화가 끝나는 순간 미리 받아 두려고 주소를 밖에 연다
export const TRACK_CHARACTER_SRC = '/images/character/track-wizard.webp';

const DELAY = 0.3;
const DURATION = 1.6;
const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export const ScoreTrack = ({ score }: { score: number }) => {
  const progress = useMotionValue(0);
  const width = useTransform(progress, (value) => `${value}%`);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(progress, score, {
      duration: DURATION,
      delay: DELAY,
      ease: EASE,
      onUpdate: (value) => setDisplay(Math.round(value)),
    });
    return () => controls.stop();
  }, [score, progress]);

  return (
    <div>
      <p className="text-xl font-medium text-muted-foreground tabular-nums">
        원어민 이해도 {display}%
      </p>

      {/* 캐릭터가 위로 올라탈 공간(64px) + 트랙 바 */}
      <div className="relative mt-16 h-5 rounded-full bg-border">
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full bg-primary"
          style={{ width }}
        />
        {/* 시작점(한국어식) 캡 */}
        <span
          className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 rounded-full"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--primary) 72%, black)',
          }}
        />
        {/* 끝점(원어민) 캡 */}
        <span className="absolute top-1/2 right-2 size-3.5 -translate-y-1/2 rounded-full bg-muted-foreground/40" />

        {/* 캐릭터 — 바 끝과 같은 모션 값을 타고 이동, 도착 후 살짝 통통 튄다 */}
        <motion.div className="absolute top-0 left-0 h-full" style={{ width }}>
          <motion.div
            className="absolute bottom-full"
            style={{ right: -26 }}
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: DELAY + DURATION,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={TRACK_CHARACTER_SRC}
              alt="날아가는 래디"
              className="object-contain"
              style={{ width: 52, height: 47 }}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
