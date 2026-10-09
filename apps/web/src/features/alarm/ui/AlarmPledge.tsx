'use client';

// 알람 시간 정하기 + 다짐 — "저는 매일 [시각]에 영어 공부를 하겠습니다!" 문장의 시각이 휠을 따라 바뀌고,
// 아래 지문을 3초 누르고 있으면 주황이 차오르며 다짐이 끝난다. 중간에 떼면 다시 비워진다
import { useEffect, useRef, useState } from 'react';
import type { AlarmTime } from '@landit/bridge';

import { haptic } from '@/shared/haptics';
import { BackHeader } from '@/shared/ui/BackHeader';

import { formatClock } from '../model/alarm-time';
import { PledgeSentence } from './PledgeSentence';
import { TimeWheel, type TimeWheelHandle } from './TimeWheel';

const HOLD_MS = 3000;

const FINGERPRINT_PATHS = [
  'M48 40C45.8782 40 43.8434 40.8429 42.3431 42.3431C40.8428 43.8434 40 45.8783 40 48C40 52.08 39.6 58.04 38.96 64',
  'M56 52.4805C56 62.0005 56 78.0005 52 88.0005',
  'M69.1602 84.08C69.6402 81.68 70.8802 74.88 71.1602 72',
  'M8 48C8 39.6047 10.6415 31.4222 15.5503 24.6116C20.4591 17.801 27.3864 12.7075 35.3509 10.0527C43.3154 7.39784 51.9133 7.31625 59.9267 9.81946C67.9401 12.3227 74.9628 17.2838 80 24',
  'M8 64H8.04',
  'M87.2002 64C88.0002 56 87.7242 42.584 87.2002 40',
  'M20 78C22 72 24 60 24 48C23.996 45.2755 24.4559 42.5701 25.36 40',
  'M34.6001 88C35.4401 85.36 36.4001 82.72 36.8801 80',
  'M36 27.1998C39.6496 25.0927 43.7897 23.9837 48.0038 23.9844C52.218 23.9851 56.3578 25.0954 60.0067 27.2036C63.6556 29.3119 66.685 32.3438 68.7904 35.9944C70.8957 39.645 72.0027 43.7856 72 47.9998V55.9998',
];

const Fingerprint = ({ className }: { className: string }) => (
  <svg
    viewBox="0 0 96 96"
    fill="none"
    className={`absolute bottom-0 left-0 size-24 ${className}`}
  >
    {FINGERPRINT_PATHS.map((d) => (
      <path
        key={d}
        d={d}
        stroke="currentColor"
        strokeWidth={5.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ))}
  </svg>
);

type Phase = 'idle' | 'holding' | 'done';

export const AlarmPledge = ({
  initialTime,
  onBack,
  onPledge,
}: {
  initialTime: AlarmTime;
  onBack?: () => void;
  onPledge: (time: AlarmTime) => void;
}) => {
  // 관성으로 도는 중에 다짐해도 화면에 보인 시각(휠이 마지막으로 지나간 칸)을 저장한다
  const wheelRef = useRef<TimeWheelHandle>(null);
  // 굴리는 동안 문장 속 시각 글자만 직접 바꾼다 — 칸마다 화면을 다시 그리면 손가락 움직임 처리가 밀려 틱이 뒤늦게 몰려온다.
  // React가 그린 글자 노드의 값만 바꾸므로, 휠이 멈춰 time이 바뀌면 React가 그대로 이어 받는다
  const chipRef = useRef<HTMLSpanElement>(null);
  const scrub = (next: AlarmTime) => {
    const text = chipRef.current?.firstChild;
    if (text) text.nodeValue = formatClock(next);
  };
  const [phase, setPhase] = useState<Phase>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const pledge = () => {
    setPhase('done');
    haptic('success');
    // 다 차는 순간 바로 넘긴다 — 저장하는 동안 "다짐했어요!"가 보인다
    onPledge(wheelRef.current?.read() ?? initialTime);
  };

  const press = () => {
    if (phase !== 'idle') return;
    setPhase('holding');
    haptic('light');
    // 1초마다 톡 — 누르고 있다는 걸 손으로 느끼게
    timers.current = [
      setTimeout(() => haptic('light'), 1000),
      setTimeout(() => haptic('light'), 2000),
      setTimeout(pledge, HOLD_MS),
    ];
  };

  const release = () => {
    if (phase !== 'holding') return;
    clearTimers();
    setPhase('idle');
  };

  const filled = phase !== 'idle';

  return (
    <main className="flex h-dvh flex-col bg-background">
      {/* 다짐이 끝나 저장하는 동안에는 뒤로 가지 못한다 — 저장이 끝나면 권한 단계로 이어진다 */}
      {onBack ? (
        <BackHeader onBack={() => phase === 'idle' && onBack()} />
      ) : (
        <div className="pt-[max(var(--safe-area-inset-top),16px)]" />
      )}
      <h1 className="px-6 pt-4 text-[26px] leading-snug font-black text-foreground">
        <PledgeSentence time={initialTime} chipRef={chipRef} />
      </h1>

      <div className="flex min-h-0 flex-1 items-center px-6">
        <div
          className={`w-full transition-opacity ${filled ? 'pointer-events-none opacity-60' : ''}`}
        >
          <TimeWheel
            ref={wheelRef}
            initialValue={initialTime}
            onScrub={scrub}
          />
        </div>
      </div>

      <div className="flex flex-col items-center rounded-t-[28px] bg-card pt-11 pb-[max(var(--safe-area-inset-bottom),28px)] shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          aria-label="3초간 눌러 다짐하기"
          // 누르는 순간의 진동은 이 버튼이 직접 낸다 — 앱 전역 버튼 진동과 겹치지 않게
          data-no-haptic
          onPointerDown={press}
          onPointerUp={release}
          onPointerLeave={release}
          onPointerCancel={release}
          // 키보드·스크린 리더가 보낸 클릭(detail 0)은 길게 누를 수 없으니 바로 다짐한다. 손가락 탭은 detail이 1 이상이다
          onClick={(event) => {
            if (event.detail === 0 && phase === 'idle') pledge();
          }}
          onContextMenu={(event) => event.preventDefault()}
          className="relative size-24 touch-none select-none [-webkit-touch-callout:none]"
        >
          <Fingerprint className="text-[#D1D6DB]" />
          {/* 누르는 동안 아래에서 위로 주황이 차오른다 — 높이 대신 서로 반대로 미는 두 겹의 transform으로 그려
              레이아웃·페인트 없이 합성만으로 돈다(느린 웹뷰에서도 끊기지 않게) */}
          <span
            aria-hidden
            className="absolute inset-0 overflow-hidden will-change-transform"
            style={{
              transform: filled ? 'translateY(0)' : 'translateY(100%)',
              transition: `transform ${filled ? `${HOLD_MS}ms linear` : '300ms ease-out'}`,
            }}
          >
            <span
              className="absolute inset-0 will-change-transform"
              style={{
                transform: filled ? 'translateY(0)' : 'translateY(-100%)',
                transition: `transform ${filled ? `${HOLD_MS}ms linear` : '300ms ease-out'}`,
              }}
            >
              <Fingerprint className="text-primary" />
            </span>
          </span>
        </button>
        <p
          className={`mt-6 text-[16px] font-bold ${phase === 'done' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          {phase === 'done' ? '다짐했어요!' : '3초간 눌러 다짐하기'}
        </p>
      </div>
    </main>
  );
};
