'use client';

// 소환 오버레이 — 램프가 흔들리다 래디가 튀어나와 오늘 대화를 건넨다.
// 앱 컬럼을 통째로 덮는다. 딤이 헤더·달력까지 가리는 것이 시안의 의도다
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';

import { registerOpenSheet } from '@/shared/ui/bottom-sheet-back';
import { Button } from '@/shared/ui/Button';
import { CloseIcon } from '@/shared/ui/Icons';

import {
  ACCEPT,
  ACCEPT_MS,
  BUBBLE_AT,
  BUBBLE_MS,
  DIM,
  DUST_AT,
  DUST_DIRECTIONS,
  DUST_MS,
  GENIE,
  GENIE_AT,
  GLOW_COLOR,
  LAMP,
  LAMP_ASPECT,
  MIST_AT,
  MIST_COUNT,
  MIST_MS,
  popIn,
  RETURN,
} from '../lib/summon-timeline';

// 카드에 놓인 램프의 자리. 같은 자리에서 시작해야 카드에서 오버레이로 넘어갈 때 튀지 않는다
// 오버레이가 쓰는 자리는 늘 시안 자리다 — 여기서 래디·말풍선 위치가 다 파생되므로
// 카드의 램프가 커지거나 옮겨져도 소환 구도는 흔들리지 않아야 한다
export interface LampRect {
  left: number;
  top: number;
  width: number;
  // 카드에 놓인 램프에서 여기까지의 차이. 그 자리에서 출발해 시안 자리로 옮겨온다
  from: { x: number; y: number; scale: number };
}

interface LampSummonProps {
  lamp: LampRect;
  // 화면이 알아서 띄운 경우에만 의사를 묻는다. 사용자가 직접 부른 것이면 이미 답을 들은 셈이다
  asks: boolean;
  onAccept: () => void;
  onClose: () => void;
}

// 닫기·수락 버튼이 공유하는 등장→퇴장 트랙 — summon에선 각자의 팝인, 나갈 땐 공통 트랙
const controlProps = (
  phase: Phase,
  reduced: boolean,
  enter: Parameters<typeof popIn>[0],
) =>
  phase === 'closing'
    ? RETURN.props
    : phase === 'accepting'
      ? ACCEPT.props
      : reduced
        ? { initial: false, animate: { opacity: 1 } }
        : popIn(enter);

// 연출을 끈 사람에게는 다 끝난 자리만 보여준다
const settle = (reduced: boolean, animated: object, settled: object) =>
  reduced ? { initial: false, animate: settled } : animated;

// 소환 → 나가기(램프로 돌아감) / 수락(대화로 들어감). 연출이 끝나야 넘어간다
type Phase = 'summon' | 'closing' | 'accepting';

export const LampSummon = ({
  lamp,
  asks,
  onAccept,
  onClose,
}: LampSummonProps) => {
  const reduced = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<Phase>('summon');

  // 연출을 끈 사람은 기다릴 이유가 없다 — 누르는 즉시 넘긴다
  const leave = (next: Phase, done: () => void) =>
    reduced ? done() : setPhase(next);

  // 완료 신호는 애니메이션 트랙 수만큼 올 수 있다 — 한 번만 내보낸다 (수락이 두 번 가면 라우팅이 두 번 쌓인다)
  const finishedRef = useRef(false);
  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (phase === 'accepting') onAccept();
    else onClose();
  };

  // 수락 연출이 끝나면 대화로 넘어간다 — 완료 콜백 대신 시계로 확정한다.
  // 래디의 완료 이벤트는 다른 트랙(램프 이동)과 겹치면 늦거나 안 올 수 있다
  useEffect(() => {
    if (phase !== 'accepting') return;
    const timer = setTimeout(
      finish,
      ACCEPT.genie.transition.duration * 1000 + 80,
    );
    return () => clearTimeout(timer);
    // finish는 렌더마다 새 참조지만 ref 잠금이 있어 한 번만 나간다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // 네이티브 뒤로가기가 화면 이동 대신 이 오버레이를 닫게 한다 — Modal·BottomSheet와 같은 결.
  // 묻지 않는 소환은 이미 대화로 가는 중이라 뒤로가기로 끊지 않는다
  useEffect(() => {
    if (!asks || phase !== 'summon') return;
    return registerOpenSheet(() => leave('closing', onClose));
    // onClose는 렌더마다 새 참조 — 걸면 매 렌더 재등록만 반복한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asks, phase, reduced]);

  // 묻지 않는 소환은 래디가 자리를 잡는 순간 스스로 수락으로 넘어간다
  useEffect(() => {
    if (asks || phase !== 'summon') return;
    if (reduced) {
      onAccept();
      return;
    }
    const timer = setTimeout(
      () => setPhase('accepting'),
      BUBBLE_MS.delay * 1000,
    );
    return () => clearTimeout(timer);
    // onAccept은 렌더마다 새 참조라 걸면 타이머가 매번 리셋된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asks, phase, reduced]);

  return (
    <div className="absolute inset-0 z-40">
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-black/60"
        {...(phase === 'closing'
          ? RETURN.dim
          : settle(reduced, DIM, { opacity: 1 }))}
        onAnimationComplete={phase === 'closing' ? finish : undefined}
      />

      {asks && (
        <motion.button
          type="button"
          onClick={() => leave('closing', onClose)}
          aria-label="나가기"
          className="absolute top-[max(env(safe-area-inset-top),16px)] left-3 z-10 flex size-11 items-center justify-center rounded-xl text-white transition-transform active:scale-90"
          {...(phase === 'summon'
            ? { initial: false, animate: { opacity: 1 } }
            : phase === 'closing'
              ? RETURN.props
              : ACCEPT.props)}
        >
          <CloseIcon size={24} />
        </motion.button>
      )}

      {/* 카드의 램프와 같은 자리에서 시작해 시안 자리로 내려간다.
          말풍선·래디는 이 상자를 기준으로 놓여 함께 움직인다 */}
      <motion.div
        className="absolute"
        style={{
          left: lamp.left,
          top: lamp.top,
          width: lamp.width,
          transformOrigin: 'top left',
        }}
        initial={reduced ? false : lamp.from}
        animate={
          phase === 'closing' && !reduced ? lamp.from : { x: 0, y: 0, scale: 1 }
        }
        transition={{
          duration: phase === 'closing' ? 0.5 : 0.9,
          ease: 'easeOut',
        }}
      >
        {asks && (
          <SpeechBubble
            reduced={reduced}
            lampWidth={lamp.width}
            leaving={phase !== 'summon'}
          />
        )}

        {phase === 'closing' && !reduced && (
          <>
            <Mist lampWidth={lamp.width} />
            <Puff lampWidth={lamp.width} />
          </>
        )}

        {/* 래디는 램프 위로 솟는다 — 램프 상자 기준으로 띄워야 어느 화면에서도 입에서 나온다 */}
        <motion.div
          className="absolute"
          style={{
            left: GENIE_AT.left * lamp.width,
            top: GENIE_AT.top * lamp.width,
            width: GENIE_AT.width * lamp.width,
            // 꼬리 끝을 기준으로 커진다 — 가운데를 기준으로 두면 작을 때 램프에서 떨어져 나온다.
            // 래디 아래끝이 램프 입에 물려 있어, 여기를 고정해야 꼬리가 내내 이어진다
            transformOrigin: '50% 100%',
          }}
          {...(phase === 'closing'
            ? RETURN.genie
            : phase === 'accepting'
              ? ACCEPT.genie
              : settle(reduced, GENIE, {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  rotate: 0,
                }))}
        >
          <Image
            src="/images/character/landy-genie.webp"
            alt=""
            width={500}
            height={613}
            // 표시 폭을 알려 원본보다 큰 후보를 막는다 — 확대 후보에서 next/image가 알파를 날린다
            sizes="260px"
            className="w-full"
          />
        </motion.div>

        <motion.div
          className="relative origin-bottom"
          animate={
            phase === 'closing'
              ? { ...RETURN.lamp.animate, opacity: RETURN.swap.animate.opacity }
              : reduced
                ? undefined
                : LAMP.animate
          }
          transition={
            phase === 'closing'
              ? { ...RETURN.lamp.transition, opacity: RETURN.swap.transition }
              : reduced
                ? undefined
                : LAMP.transition
          }
        >
          <Image
            src="/images/character/lamp-idle.webp"
            alt=""
            width={660}
            height={528}
            sizes="330px"
            className="w-full"
          />
        </motion.div>

        {!reduced && <Dust lampWidth={lamp.width} />}
      </motion.div>

      {/* CTA는 화면 바닥이 아니라 램프 바로 아래 선다 — 램프에서 시선이 그대로 떨어진다 */}
      {asks && (
        <motion.div
          className="absolute inset-x-6"
          style={{ top: lamp.top + lamp.width * LAMP_ASPECT + 24 }}
          {...controlProps(phase, reduced, ACCEPT_MS)}
        >
          <Button
            className="text-lg"
            onClick={() => leave('accepting', onAccept)}
          >
            네!
          </Button>
        </motion.div>
      )}
    </div>
  );
};

// 래디가 건네는 말 — 문구가 고정이라 손그림 말풍선을 고정 크기 이미지로 깐다
const SpeechBubble = ({
  reduced,
  lampWidth,
  leaving,
}: {
  reduced: boolean;
  lampWidth: number;
  leaving: boolean;
}) => (
  <motion.div
    className="absolute"
    style={{
      left: BUBBLE_AT.left * lampWidth,
      top: BUBBLE_AT.top * lampWidth,
      width: BUBBLE_AT.width * lampWidth,
    }}
    {...(leaving
      ? RETURN.props
      : reduced
        ? { initial: false, animate: { opacity: 1, y: 0, scale: 1 } }
        : popIn(BUBBLE_MS))}
  >
    <Image
      src="/images/character/speech-bubble.webp"
      alt=""
      width={450}
      height={225}
      sizes="300px"
      className="w-full"
    />

    {/* 자리는 시안 텍스트 박스(본문 240x90 안에서 x56 y24)를 이 그림 크기로 환산한 값.
        글자도 램프 폭에 비례한다 — 고정 px면 작은 폰에서 말풍선을 뚫고 나온다 (기준 20px/램프 226px) */}
    <p
      className="absolute top-[48.9%] left-[49.4%] w-[54%] -translate-x-1/2 -translate-y-1/2 text-center leading-snug font-extrabold break-keep text-foreground"
      style={{ fontSize: lampWidth * 0.0885 }}
    >
      오늘의 대화를 시작할까요?
    </p>
  </motion.div>
);

// 램프 목에서 새어나오는 연기 — 다섯 덩이가 조금씩 어긋나게 부풀어 오른다
const Mist = ({ lampWidth }: { lampWidth: number }) => (
  <>
    {Array.from({ length: MIST_COUNT }, (_, index) => (
      <motion.span
        key={index}
        aria-hidden
        className="absolute rounded-full"
        style={{
          left: (MIST_AT.x - MIST_AT.size / 2) * lampWidth,
          top: (MIST_AT.y - MIST_AT.size / 2) * lampWidth,
          width: MIST_AT.size * lampWidth,
          height: MIST_AT.size * lampWidth,
          // 블러를 걸면 크게 확대할 때 블러의 사각 경계가 그대로 보인다 — 그라디언트로 번지게 한다
          background: `radial-gradient(circle, ${GLOW_COLOR} 0%, transparent 70%)`,
        }}
        initial={{ opacity: 0, scale: 0.15, y: 0 }}
        animate={{
          opacity: [0, 0.55, 0.4, 0],
          scale: [0.15, 3.2, 3.8],
          y: [0, -140, -140],
        }}
        transition={{
          delay: (MIST_MS.start + index * MIST_MS.stagger) / 1000,
          duration: MIST_MS.duration / 1000,
          ease: 'easeOut',
        }}
      />
    ))}
  </>
);

// 램프가 래디를 삼킨 자리에서 터지는 퍼프
const Puff = ({ lampWidth }: { lampWidth: number }) => (
  <motion.span
    aria-hidden
    className="absolute rounded-full"
    style={{
      left: (DUST_AT.x - 0.5) * lampWidth,
      top: (DUST_AT.y - 0.5) * lampWidth,
      width: lampWidth,
      height: lampWidth,
      background: `radial-gradient(circle, ${GLOW_COLOR} 0%, transparent 68%)`,
    }}
    initial={{ opacity: 0, scale: 0.3 }}
    {...RETURN.puff}
  />
);

// 램프가 터질 때 목에서 사방으로 튀는 먼지
const Dust = ({ lampWidth }: { lampWidth: number }) => (
  <>
    {DUST_DIRECTIONS.map(({ x, y }, index) => (
      <motion.span
        key={index}
        aria-hidden
        className="absolute rounded-full"
        style={{
          left: (DUST_AT.x - DUST_AT.size / 2) * lampWidth,
          top: (DUST_AT.y - DUST_AT.size / 2) * lampWidth,
          width: DUST_AT.size * lampWidth,
          height: DUST_AT.size * lampWidth,
          background: `radial-gradient(circle, ${GLOW_COLOR} 0%, transparent 72%)`,
        }}
        initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0.4, 2, 2],
          x: [0, x, x],
          y: [0, y, y],
        }}
        transition={{ ...DUST_MS, ease: 'easeOut' }}
      />
    ))}
  </>
);
