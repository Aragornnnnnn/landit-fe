'use client';

// 대화 상대 캐릭터 — Rive에서 뽑은 표정 데이터를 플레이어로 재생하고, 듣기(끄덕임)·말하기(립싱크)를 그 위에 얹는다.
// 표정 전환·깜빡임·숨쉬기는 데이터 안의 애니메이션이 맡고, 여기서는 대화 상태에 따라 바뀌는 움직임만 정한다.
// 값은 아래 사양표(LISTENING·NODDING·MIMING)에 모아 두고, 함수는 "언제 무엇을 얹는가"만 말한다.
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

import { reportWarning } from '@/shared/monitoring/report';

import type { CharacterLook, Partner } from '../../model/character-look';
import {
  advanceMouth,
  closedMouth,
  loadLoudnessTrack,
  toArticulationTrack,
  toVisemes,
  type MouthState,
} from '../../model/lipsync';
import type { PlayingSpeech } from '../../model/useAiSpeech';
import { ExpressionPlayer, type ExpressionData } from './expression-player';
import { PartnerAvatar } from './PartnerAvatar';
import styles from './PartnerCharacter.module.css';
import { VIEWBOX } from './parts-by-partner';

/**
 * partner — 누구를 그릴지. 서버가 내려주는 characterId다.
 * look — 자세와 표정.
 * speech — 재생 중인 발화. 있으면 입을 소리에 맞추고, 없으면 음절 흉내로 움직인다.
 */
interface PartnerCharacterProps {
  partner: Partner;
  look: CharacterLook;
  speech: PlayingSpeech | null;
  // 그릴 영역을 좁혀 상반신만 보여줄 때 쓴다. 생략하면 원본 그대로(전신)
  viewBox?: string;
}

/** 상대별 표정 데이터 — 화면에 그 상대가 나올 때만 불러온다 */
const LOADERS: Record<Partner, () => Promise<ExpressionData>> = {
  chloe: () =>
    import('./expressions/chloe.json').then(
      (m) => m.default as unknown as ExpressionData,
    ),
  marco: () =>
    import('./expressions/marco.json').then(
      (m) => m.default as unknown as ExpressionData,
    ),
  teddy: () =>
    import('./expressions/teddy.json').then(
      (m) => m.default as unknown as ExpressionData,
    ),
};

type Range = readonly [number, number];
const pick = ([min, max]: Range) => min + Math.random() * (max - min);
const chance = (probability: number) => Math.random() < probability;

/** 듣는 자세 — 고개를 살짝 기울여 귀 기울인다 (라디안) */
const LISTENING = { tilt: 0.035, follow: 6 } as const;

/** 듣는 동안의 맞장구 끄덕임. 깊이는 SVG 단위, 시간은 초 */
const NODDING = {
  gap: [2, 3.5],
  depth: [5, 9],
  duration: [0.65, 0.85],
  twiceChance: 0.35,
} as const;

/** 맞출 소리가 없을 때 도는 입 흉내 — 음절을 몰아 쏘고 구절 사이에 쉰다 */
const MIMING = {
  syllable: [0.2, 0.3],
  open: [0.35, 0.75],
  syllables: [2, 5],
  pause: [0.35, 0.65],
  longPause: [0.35, 1.3],
  longPauseChance: 0.25,
} as const;

// 음량 표를 기다리며 입을 닫아 두는 한도 — 음성 앞머리 무음(약 0.4초)을 넘기면 소리가 나는데 입이 닫혀 있게 된다
const LOUDNESS_WAIT_MS = 500;

/**
 * 재생 시각만 읽어 입 상태를 매 프레임 계산한다. 소리 경로는 건드리지 않는다.
 * 음량 표는 디코딩이 끝나야 생기고, 그 전까지는 입을 닫아 둔다. 표가 늦거나 실패하면 글자를 고르게 나눠 움직인다.
 */
const driveMouth = (
  { playback, text }: PlayingSpeech,
  onMouth: (state: MouthState | null) => void,
) => {
  const visemes = toVisemes(text);
  let track: Float32Array | null = null;
  // 표를 읽기 전엔 입을 닫아 둔다 — 음성 앞머리는 무음이라, 글자대로 움직이면 소리 없이 입부터 열린다
  let articulation: Float32Array | null = Float32Array.of(NaN);
  let driving = true;
  let frame = 0;

  const waitTimer = window.setTimeout(() => {
    articulation = null;
  }, LOUDNESS_WAIT_MS);

  void loadLoudnessTrack(playback.source).then((loaded) => {
    if (!driving) return;
    window.clearTimeout(waitTimer);
    track = loaded;
    // 디코딩에 실패하면 글자를 고르게 나누는 방식으로 돌아간다 — 입은 계속 움직인다
    articulation = loaded && toArticulationTrack(loaded);
  });

  let state = closedMouth;
  const nextFrame = () => {
    state = advanceMouth(
      state,
      visemes,
      track,
      playback.progress(),
      articulation,
    );
    onMouth(state);
    frame = requestAnimationFrame(nextFrame);
  };
  nextFrame();

  return () => {
    driving = false;
    window.clearTimeout(waitTimer);
    cancelAnimationFrame(frame);
    onMouth(null);
  };
};

/** 자세에 따라 얹는 움직임의 현재 상태 — 프레임마다 이어서 계산한다 */
const createMotion = () => ({
  tilt: 0,
  nodLeft: 0,
  nodDuration: 1,
  nodDepth: 0,
  nodNext: pick(NODDING.gap),
  mime: { ...closedMouth },
  mimeTarget: closedMouth.sy,
  mimeLeft: 0,
  mimeSyllables: 0,
});

type Motion = ReturnType<typeof createMotion>;

const MOUTH_SWAPS = ['mouth-line', 'mouth-grit', 'mouth-pout'] as const;

/** 말하는 입 — 원래 그림의 벌린 입을 상태만큼 벌리고, 표정용 입들은 감춘다 */
const showMouth = (player: ExpressionPlayer, { sx, sy, dy }: MouthState) => {
  player.adjust('mouth-open', 'opacity', { set: 1 });
  player.adjust('mouth-open', 'scaleX', { set: sx });
  player.adjust('mouth-open', 'scaleY', { set: sy });
  player.adjust('mouth-open', 'y', { add: dy });
  for (const name of MOUTH_SWAPS) player.adjust(name, 'opacity', { set: 0 });
};

/** 입을 표정에 돌려준다 */
const releaseMouth = (player: ExpressionPlayer) => {
  for (const prop of ['opacity', 'scaleX', 'scaleY', 'y'])
    player.adjust('mouth-open', prop, null);
  for (const name of MOUTH_SWAPS) player.adjust(name, 'opacity', null);
};

/** 소리 없이 말하는 동안 음절을 흉내 낸다 */
const stepMiming = (motion: Motion, dt: number) => {
  motion.mimeLeft -= dt;
  if (motion.mimeLeft <= 0) {
    if (motion.mimeSyllables > 0) {
      motion.mimeSyllables -= 1;
      motion.mimeTarget = pick(MIMING.open);
      motion.mimeLeft = pick(MIMING.syllable);
    } else {
      motion.mimeSyllables = Math.round(pick(MIMING.syllables));
      motion.mimeTarget = closedMouth.sy;
      motion.mimeLeft = pick(
        chance(MIMING.longPauseChance) ? MIMING.longPause : MIMING.pause,
      );
    }
  }
  // 음절 중간에 입을 다시 오므려야 연달아 말하는 것처럼 보인다
  const halfway = motion.mimeLeft < 0.1 ? closedMouth.sy : motion.mimeTarget;
  const sy = motion.mime.sy + (halfway - motion.mime.sy) * Math.min(1, dt * 18);
  motion.mime = { sx: 0.9, sy, dy: (sy - 0.4) * 5 };
  return motion.mime;
};

/** 듣는 동안 가끔 끄덕인다. 고개 아래 이동 거리(SVG 단위)를 돌려준다 */
const stepNodding = (motion: Motion, dt: number) => {
  if (motion.nodLeft > 0) {
    motion.nodLeft -= dt;
    const progress = 1 - Math.max(motion.nodLeft, 0) / motion.nodDuration;
    // 살짝 들었다가 내리는 예비 동작이 있어야 끄덕임에 무게가 생긴다
    return (
      motion.nodDepth *
      (Math.sin(Math.PI * progress) - 0.15 * Math.sin(2 * Math.PI * progress))
    );
  }
  motion.nodNext -= dt;
  if (motion.nodNext <= 0) {
    motion.nodDuration = pick(NODDING.duration);
    motion.nodLeft = motion.nodDuration;
    motion.nodDepth = pick(NODDING.depth);
    motion.nodNext =
      pick(NODDING.gap) +
      (chance(NODDING.twiceChance) ? 0 : motion.nodDuration);
  }
  return 0;
};

export const PartnerCharacter = ({
  partner,
  look: { posture, expression },
  speech,
  viewBox,
}: PartnerCharacterProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ExpressionPlayer | null>(null);
  // 3겹(끄덕임·입 흉내)은 모션을 줄이는 설정에서 빠진다. 입모양은 소리를 따라가는 정보라 남긴다
  const stillness = useReducedMotion() ?? false;
  const [ready, setReady] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const frameBox = viewBox ?? VIEWBOX[partner];

  // 프레임 콜백이 매번 새로 읽는 값 — 바뀔 때마다 플레이어를 다시 만들지 않는다
  const live = useRef({
    posture,
    expression,
    stillness,
    mouth: null as MouthState | null,
  });
  useEffect(() => {
    live.current.posture = posture;
    live.current.expression = expression;
    live.current.stillness = stillness;
  });

  useEffect(() => {
    let alive = true;
    void LOADERS[partner]().then(
      (data) => {
        const host = hostRef.current;
        if (!alive || !host) return;
        const player = new ExpressionPlayer(host, data, {
          ambient: !stillness,
        });
        player.setExpression(live.current.expression, { instant: true });
        const motion = createMotion();
        player.onFrame = (dt) => {
          const { posture: now, stillness: still, mouth } = live.current;
          const tiltTarget = now === 'listening' && !still ? LISTENING.tilt : 0;
          motion.tilt +=
            (tiltTarget - motion.tilt) * Math.min(1, dt * LISTENING.follow);
          const nod =
            now === 'listening' && !still ? stepNodding(motion, dt) : 0;
          player.adjust('head', 'rotation', { add: motion.tilt });
          player.adjust('head', 'y', { add: nod });
          if (mouth) showMouth(player, mouth);
          else if (now === 'speaking' && !still)
            showMouth(player, stepMiming(motion, dt));
          else releaseMouth(player);
        };
        playerRef.current = player;
        player.start();
        setReady((n) => n + 1);
      },
      (error: unknown) => {
        // 표정 데이터를 못 받으면 표정 없는 파츠 그림(CSS 숨쉬기만 돈다)으로 대신한다 — 대화는 표정 없이도 이어진다
        if (!alive) return;
        reportWarning(error, { partner });
        setLoadFailed(true);
      },
    );
    return () => {
      alive = false;
      playerRef.current?.stop();
      playerRef.current = null;
    };
  }, [partner, stillness]);

  useEffect(() => {
    playerRef.current?.setExpression(expression);
  }, [expression, ready]);

  useEffect(() => {
    playerRef.current?.element.setAttribute('viewBox', frameBox);
  }, [frameBox, ready]);

  useEffect(() => {
    if (!speech) return;
    return driveMouth(speech, (state) => {
      live.current.mouth = state;
    });
  }, [speech]);

  if (loadFailed)
    return (
      <div className={styles.root}>
        <PartnerAvatar partner={partner} viewBox={frameBox} />
      </div>
    );

  return (
    <div className={styles.root}>
      <div className={styles.stage}>
        {/* 크기를 잡는 빈 그림 — 데이터를 불러오기 전에도 자리를 차지해 바깥 배치가 흔들리지 않는다 */}
        <svg viewBox={frameBox} className={styles.sizer} aria-hidden />
        <div ref={hostRef} className={styles.host} aria-hidden />
      </div>
    </div>
  );
};
