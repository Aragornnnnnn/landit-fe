// 마이크 컨트롤 — 대기(말하기·키보드) ↔ 듣는 중(X·■) ↔ 말한 뒤 확인(다시 말하기·보내기)을 전환한다.
// 키보드 입력창도, 듣는 중이라는 안내도 내 답변 박스(UserTranscript)가 맡는다 — 같은 말을 두 군데서 하지 않는다
'use client';

import { motion } from 'motion/react';

import {
  ArrowUpIcon,
  CloseIcon,
  KeyboardIcon,
  MicIcon,
  ResendIcon,
  StopIcon,
} from '@/shared/ui/Icons';

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
  // 전달되지 못한 답변이 있을 때만 준다 — 주면 마이크 자리가 다시 보내기로 바뀐다
  onResend?: () => void;
  // 말한 뒤 확인 중일 때만 준다 — 주면 X·■ 자리가 다시 말하기·보내기로 바뀐다
  review?: { onRetry: () => void; onSend: () => void };
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
  onResend,
  review,
}: MicControlProps) => {
  const listening = phase === 'USER_SPEAKING';
  // 발화·속마음 중엔 누를 수 없게 잠근다 — 자리는 유지해 레이아웃이 튀지 않게
  const disabled = phase !== 'USER_READY' && !listening;

  return (
    <div className="flex h-24 flex-none flex-col items-center justify-center">
      {/* 컨트롤은 즉시 전환한다 — exit 애니메이션 대기는 입력 지연으로 느껴진다 */}
      {listening && review ? (
        <motion.div
          key="review"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18 }}
          // 이름은 버튼 아래로 늘어뜨린다 — 버튼을 X·■와 같은 높이에 둬야 답변 칸과의 간격이 그대로다.
          // 줄 높이를 글자 크기만큼만 둬 가장 큰 글자 크기에서도 아래 여백 안에 들어간다
          className="flex items-center gap-8"
        >
          {/* X·■와 같은 자리·크기 — 엄지를 옮기지 않고 바로 보낸다 */}
          <div className="relative flex flex-col items-center">
            <button
              onClick={review.onRetry}
              aria-label="다시 말하기"
              className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground active:scale-95"
            >
              <MicIcon size={26} />
            </button>
            <p
              aria-hidden
              className="absolute top-full mt-1 text-xs leading-none font-semibold whitespace-nowrap text-muted-foreground"
            >
              다시 말하기
            </p>
          </div>
          <div className="relative flex flex-col items-center">
            <button
              onClick={review.onSend}
              aria-label="보내기"
              className="flex size-20 items-center justify-center rounded-full bg-primary text-white active:scale-95"
            >
              <ArrowUpIcon size={32} strokeWidth={2.5} />
            </button>
            <p
              aria-hidden
              className="absolute top-full mt-1 text-xs leading-none font-semibold whitespace-nowrap text-muted-foreground"
            >
              보내기
            </p>
          </div>
        </motion.div>
      ) : listening ? (
        <motion.div
          key="listening"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col items-center gap-3"
        >
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
      ) : onResend ? (
        // 같은 자리·크기의 버튼이 잠깐 다시 보내기로 바뀐다 — 그 턴은 새로 말하거나 타이핑할 수 없다
        <motion.div
          key="resend"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18 }}
          // 아래 안내 한 줄만큼 올려 버튼과 안내가 함께 가운데 오게 한다
          className="relative mb-2.5 flex flex-col items-center"
        >
          <button
            onClick={onResend}
            disabled={disabled}
            aria-label="다시 보내기"
            className="flex size-20 items-center justify-center rounded-full bg-primary text-white transition-opacity active:scale-95 disabled:opacity-30"
          >
            <ResendIcon size={34} />
          </button>
          <p className="absolute top-full mt-1 text-xs font-semibold whitespace-nowrap text-muted-foreground">
            눌러서 다시 보내기
          </p>
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
        </motion.div>
      )}
    </div>
  );
};
