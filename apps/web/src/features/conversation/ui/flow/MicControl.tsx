// 마이크 컨트롤 — 대기(말하기·키보드) ↔ 듣는 중(X·■)을 전환한다. 키보드 입력창은 내 답변 박스(UserTranscript)가 맡는다
'use client';

import { motion } from 'motion/react';

import { CloseIcon, KeyboardIcon, MicIcon, StopIcon } from '@/shared/ui/Icons';

import type { ConversationPhase } from '../../model/conversation-machine';

interface MicControlProps {
  phase: ConversationPhase;
  onPress: () => void;
  // 타이핑으로 답할 수 있는 대화만 넘긴다 — 없으면 키보드 아이콘을 그리지 않는다
  onKeyboard?: () => void;
  onCancel: () => void;
  onDone: () => void;
  // 남은 몫(0~1). 시간이 걸린 대화(스몰톡)만 준다 — 주면 완료 버튼 둘레가 그만큼 차 있다
  remainingRatio?: number;
}

// 완료 버튼(size-20=80px) 둘레를 도는 링 — 버튼 밖으로 6px씩 나가 92px
const RING_SIZE = 92;
const RING_RADIUS = 44;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export const MicControl = ({
  phase,
  onPress,
  onKeyboard,
  onCancel,
  onDone,
  remainingRatio,
}: MicControlProps) => {
  const listening = phase === 'USER_SPEAKING';
  // 발화·속마음 중엔 누를 수 없게 잠근다 — 자리는 유지해 레이아웃이 튀지 않게
  const disabled = phase !== 'USER_READY' && !listening;

  return (
    <div className="flex h-36 flex-none flex-col items-center justify-center gap-2">
      {/* 컨트롤은 즉시 전환한다 — exit 애니메이션 대기는 입력 지연으로 느껴진다 */}
      {listening ? (
        <motion.div
          key="listening"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col items-center gap-3"
        >
          <p className="text-sm font-medium text-muted-foreground">
            말을 듣고 있어요..
          </p>
          <div className="flex items-center gap-8">
            <button
              onClick={onCancel}
              aria-label="답변 중단"
              className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive active:scale-95"
            >
              <CloseIcon size={26} strokeWidth={2.5} />
            </button>
            <button
              onClick={onDone}
              aria-label="답변 완료"
              className="relative flex size-20 items-center justify-center rounded-full bg-primary text-white active:scale-95"
            >
              {/* 듣는 중임을 알리는 바깥 링 펄스 — 남은 시간 링이 있으면 그쪽이 같은 말을 하므로 접는다 */}
              {remainingRatio == null ? (
                <motion.span
                  className="absolute inset-0 rounded-full bg-primary/30"
                  animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              ) : (
                // 12시 방향에서 시작해 시계 방향으로 줄어든다. 1초에 한 번 갱신되는 값이라 그만큼 이어 그린다.
                // 크기는 명시한다 — inset만 주면 WebKit이 svg를 늘리지 않고 버튼 폭에 맞춰 링이 왼쪽 위로 밀린다
                <svg
                  className="pointer-events-none absolute -inset-1.5 -rotate-90"
                  width={RING_SIZE}
                  height={RING_SIZE}
                  viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                  aria-hidden
                >
                  <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth={4}
                    className="stroke-primary/15"
                  />
                  <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    fill="none"
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeDasharray={RING_LENGTH}
                    strokeDashoffset={RING_LENGTH * (1 - remainingRatio)}
                    className="stroke-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
                  />
                </svg>
              )}
              <StopIcon size={28} />
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="idle"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18 }}
          className="relative flex flex-col items-center gap-2"
        >
          {/* 마이크는 가운데 고정, 키보드 아이콘은 오른쪽에 작게 — 누르면 내 답변 박스가 입력창으로 바뀐다 */}
          {onKeyboard && (
            <button
              onClick={onKeyboard}
              disabled={disabled}
              aria-label="키보드로 입력"
              className="absolute top-1.5 left-[calc(50%+3rem)] flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground transition-opacity active:scale-95 disabled:opacity-30"
            >
              <KeyboardIcon size={22} />
            </button>
          )}
          <button
            onClick={onPress}
            disabled={disabled}
            aria-label="말하기"
            className="flex size-20 items-center justify-center rounded-full bg-primary text-white transition-opacity active:scale-95 disabled:opacity-30"
          >
            <MicIcon size={34} />
          </button>
          <p
            className={`text-base font-bold ${disabled ? 'text-primary/30' : 'text-primary'}`}
          >
            말하기
          </p>
        </motion.div>
      )}
    </div>
  );
};
