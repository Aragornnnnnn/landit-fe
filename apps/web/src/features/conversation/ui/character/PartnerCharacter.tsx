'use client';

// 대화 상대 캐릭터. 움직임은 세 겹이고 이 파일은 그중 3겹만 맡는다.
// 1겹 상시 idle(호흡·체중이동)과 2겹 자세는 PartnerCharacter.module.css가 가진다.
// 3겹은 주기가 일정하면 어색해지는 움직임이라 여기서 랜덤 타이밍으로 쏜다.
//
// 값은 전부 아래 사양표(BLINKING·NODDING·MIMING)에 모아 두고, 함수는 "언제 쏘는가"만 말한다.
import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

import type { CharacterLook, Partner } from '../../model/character-look';
import {
  advanceMouth,
  closedMouth,
  loadLoudnessTrack,
  toVisemes,
} from '../../model/lipsync';
import type { PlayingSpeech } from '../../model/useAiSpeech';
import styles from './PartnerCharacter.module.css';
import { PARTS } from './parts';

/**
 * partner — 누구를 그릴지. 세션 TTS 음성 성별이 정한다.
 * look — 자세와 표정. 둘 다 CSS 클래스가 되어 겹쳐 붙는다.
 * speech — 재생 중인 발화. 있으면 입을 소리에 맞추고, 없으면 음절 흉내로 움직인다.
 */
interface PartnerCharacterProps {
  partner: Partner;
  look: CharacterLook;
  speech: PlayingSpeech | null;
  // 그릴 영역을 좁혀 상반신만 보여줄 때 쓴다. 생략하면 파츠 원본 그대로(전신)
  viewBox?: string;
}

type Range = readonly [number, number];

const pick = ([min, max]: Range) => min + Math.random() * (max - min);
const chance = (probability: number) => Math.random() < probability;

/**
 * 눈 깜빡임. 사람은 5초를 참기도 하고 가끔 연달아 두 번 깜빡여서,
 * 정확히 N초마다 도는 CSS 애니메이션으로는 기계처럼 보인다.
 */
const BLINKING = {
  gapMs: [1800, 5500],
  durationMs: 140,
  closedScale: 0.06,
  twiceChance: 0.18,
  twiceDelayMs: 220,
} as const;

/**
 * 듣는 자세의 맞장구. 끄덕임 하나에 가끔 한 번 더, 또는 눈썹 들기가 따라붙는다.
 * depth는 고개가 내려가는 정도(px)다 — 정면 2D라 회전을 쓰면 갸우뚱으로 보인다.
 */
const NODDING = {
  gapMs: [2000, 3500],
  depth: [5, 9],
  durationMs: [650, 850],
  twiceChance: 0.35,
  twiceDepth: [4, 6],
  twiceDurationMs: 600,
  twiceDelayMs: 800,
  browChance: 0.3,
  browLiftPx: 6,
  browDurationMs: 420,
} as const;

/**
 * 맞출 소리가 없을 때 도는 입 흉내. 음절 몇 개를 몰아 쏘고 구절 사이에 쉰다.
 * 음성 미설정 시나리오와 합성이 끝나기 전 구간을 덮는다.
 * openness는 세로 압축률이라 작을수록 크게 벌어진다.
 */
const MIMING = {
  syllables: [2, 5],
  syllableMs: 300,
  strideMs: [240, 320],
  openness: [0.35, 0.65],
  dropPx: [1, 3],
  durationMs: [200, 300],
  pauseMs: [350, 650],
  longPauseMs: [350, 1300],
  longPauseChance: 0.25,
  nodChance: 0.35,
  nodDepth: 3,
  nodDurationMs: 380,
} as const;

/**
 * 일회성 액센트의 공통 설정.
 * composite를 'add'로 두는 이유 — 기본값인 교체로 두면 CSS가 잡아둔 자세를 덮어써서
 * 시작·끝에 자세가 튄다 (기울인 고개가 0으로 리셋됐다 돌아온다).
 */
const ACCENT = { easing: 'ease-in-out', composite: 'add' } as const;

/** 눈을 감았다 뜬다. 눈꺼풀을 그리지 않고 세로로 눌러 흉내낸다 */
const blink = (eye: Element) =>
  eye.animate(
    [
      { transform: 'scaleY(1)' },
      { transform: `scaleY(${BLINKING.closedScale})` },
      { transform: 'scaleY(1)' },
    ],
    { duration: BLINKING.durationMs, ...ACCENT },
  );

/**
 * 고개를 끄덕인다.
 * 정면 2D에서 회전은 좌우 기울임(갸우뚱)으로 보이므로, 하강과 세로 압축을 조합한
 * 원근 착시로 만든다. 살짝 위로 빼는 예비 동작이 있어야 동작에 무게가 생긴다.
 */
const nod = (head: Element, depth: number, ms: number) =>
  head.animate(
    [
      { transform: 'translateY(0px) scaleY(1)' },
      { transform: 'translateY(-1.5px) scaleY(1.006)', offset: 0.18 },
      {
        transform: `translateY(${depth * 0.5}px) scaleY(${1 - depth * 0.005})`,
        offset: 0.5,
      },
      {
        transform: `translateY(${depth * 0.4}px) scaleY(${1 - depth * 0.004})`,
        offset: 0.66,
      },
      { transform: 'translateY(0px) scaleY(1)' },
    ],
    { duration: ms, ...ACCENT },
  );

/** 눈썹을 들었다 놓는다 — 리액션의 잔잔한 강조 */
const raiseBrow = (brow: Element) =>
  brow.animate(
    [
      { transform: 'translateY(0)' },
      { transform: `translateY(${-NODDING.browLiftPx}px)` },
      { transform: 'translateY(0)' },
    ],
    { duration: NODDING.browDurationMs, ...ACCENT },
  );

/** 입을 한 번 벌렸다 닫는다 */
const openMouth = (
  mouth: Element,
  openness: number,
  drop: number,
  ms: number,
) =>
  mouth.animate(
    [
      { transform: 'scaleY(1)' },
      { transform: `scaleY(${openness}) translateY(${drop}px)` },
      { transform: 'scaleY(1)' },
    ],
    { duration: ms, ...ACCENT },
  );

/**
 * 예약과 진행 중인 동작을 한꺼번에 거두는 장부.
 * 타이머만 지우면 이미 시작된 850ms짜리 끄덕임이 다음 자세로 넘어가서도 이어진다 —
 * 속마음 말풍선 위에서 계속 끄덕이던 원인이다.
 * 끝난 애니메이션은 스스로 빠져서 오래 듣고 있어도 장부가 불어나지 않는다.
 */
const createAccents = () => {
  const timers = new Set<number>();
  const running = new Set<Animation>();

  return {
    later(run: () => void, ms: number) {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        run();
      }, ms);
      timers.add(timer);
    },
    play(animation: Animation) {
      running.add(animation);
      animation.onfinish = () => running.delete(animation);
    },
    stopAll() {
      timers.forEach((timer) => window.clearTimeout(timer));
      running.forEach((animation) => animation.cancel());
    },
  };
};

type Accents = ReturnType<typeof createAccents>;

/** 모션이 붙는 파츠 — 생성 스크립트가 붙인 그룹 id로 찾는다 */
const readParts = (root: HTMLElement) => ({
  head: root.querySelector('#head-inner'),
  mouth: root.querySelector<SVGGElement>('#mouth'),
  eyes: root.querySelectorAll('#eye-left, #eye-right'),
  brows: root.querySelectorAll('#brow-left, #brow-right'),
});

type CharacterParts = ReturnType<typeof readParts>;

/** 자세와 무관하게 계속 도는 깜빡임 */
const keepBlinking = (eyes: CharacterParts['eyes'], accents: Accents) => {
  const blinkBoth = () => eyes.forEach((eye) => accents.play(blink(eye)));

  accents.later(() => {
    blinkBoth();
    if (chance(BLINKING.twiceChance))
      accents.later(blinkBoth, BLINKING.twiceDelayMs);
    keepBlinking(eyes, accents);
  }, pick(BLINKING.gapMs));
};

/** 듣는 동안 도는 맞장구 */
const keepNodding = (parts: CharacterParts, accents: Accents) => {
  const { head, brows } = parts;
  if (!head) return;

  const nodAgain = () =>
    accents.play(nod(head, pick(NODDING.twiceDepth), NODDING.twiceDurationMs));

  accents.later(() => {
    accents.play(nod(head, pick(NODDING.depth), pick(NODDING.durationMs)));
    if (chance(NODDING.twiceChance))
      accents.later(nodAgain, NODDING.twiceDelayMs);
    if (chance(NODDING.browChance))
      brows.forEach((brow) => accents.play(raiseBrow(brow)));
    keepNodding(parts, accents);
  }, pick(NODDING.gapMs));
};

/** 맞출 소리가 없을 때 도는 입 흉내 */
const keepMiming = (parts: CharacterParts, accents: Accents) => {
  const { head, mouth } = parts;
  if (!mouth) return;

  const syllables = Math.round(pick(MIMING.syllables));
  for (let index = 0; index < syllables; index++) {
    accents.later(
      () =>
        accents.play(
          openMouth(
            mouth,
            pick(MIMING.openness),
            pick(MIMING.dropPx),
            pick(MIMING.durationMs),
          ),
        ),
      index * pick(MIMING.strideMs),
    );
  }
  if (head && chance(MIMING.nodChance))
    accents.play(nod(head, MIMING.nodDepth, MIMING.nodDurationMs));

  const pause = pick(
    chance(MIMING.longPauseChance) ? MIMING.longPauseMs : MIMING.pauseMs,
  );
  accents.later(
    () => keepMiming(parts, accents),
    syllables * MIMING.syllableMs + pause,
  );
};

/**
 * 재생 시각만 읽어 입모양과 벌림을 매 프레임 다시 그린다. 소리 경로는 건드리지 않는다.
 * 자세 transition을 끄는 이유 — 켜두면 0.4초 보간이 매 프레임을 서로 취소해 입이 굳는다.
 * 음량 표는 디코딩이 끝나야 생기고, 그 전까지는 보통 크기로 흘러간다.
 * 정리할 때 인라인 스타일을 지워 입을 자세 CSS에 돌려준다.
 */
const driveMouth = (mouth: SVGGElement, { playback, text }: PlayingSpeech) => {
  const visemes = toVisemes(text);
  let track: Float32Array | null = null;
  let driving = true;
  let frame = 0;

  void loadLoudnessTrack(playback.source).then((loaded) => {
    if (driving) track = loaded;
  });

  mouth.style.transition = 'none';
  let state = closedMouth;
  const nextFrame = () => {
    state = advanceMouth(state, visemes, track, playback.progress());
    const { sx, sy, dy } = state;
    mouth.style.transform = `translateY(${dy.toFixed(1)}px) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
    frame = requestAnimationFrame(nextFrame);
  };
  nextFrame();

  return () => {
    driving = false;
    cancelAnimationFrame(frame);
    mouth.style.transform = '';
    mouth.style.transition = '';
  };
};

export const PartnerCharacter = ({
  partner,
  look: { posture, expression },
  speech,
  viewBox,
}: PartnerCharacterProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  // 1겹은 CSS가 접지만 3겹은 여기서 판단해야 한다. 입모양은 소리를 따라가는 정보라 남긴다
  const stillness = useReducedMotion() ?? false;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || stillness) return;

    const accents = createAccents();
    keepBlinking(readParts(root).eyes, accents);

    return () => accents.stopAll();
  }, [partner, stillness]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || stillness) return;

    const parts = readParts(root);
    const accents = createAccents();
    if (posture === 'listening') keepNodding(parts, accents);
    if (posture === 'speaking' && !speech) keepMiming(parts, accents);

    return () => accents.stopAll();
  }, [partner, posture, speech, stillness]);

  useEffect(() => {
    const mouth = rootRef.current?.querySelector<SVGGElement>('#mouth');
    if (!mouth || !speech) return;

    return driveMouth(mouth, speech);
  }, [speech]);

  const Parts = PARTS[partner];

  return (
    <div
      ref={rootRef}
      className={[styles.root, styles[posture], styles[expression]]
        .filter(Boolean)
        .join(' ')}
    >
      {/* viewBox는 있을 때만 넘긴다 — undefined로 넘기면 파츠가 들고 있던 원본 viewBox를 지워 캐릭터가 사라진다 */}
      <Parts
        className={styles.parts}
        {...(viewBox && { viewBox })}
        aria-hidden
      />
    </div>
  );
};
