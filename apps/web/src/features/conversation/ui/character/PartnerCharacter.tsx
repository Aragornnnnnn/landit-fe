'use client';

// 대화 상대 캐릭터. 움직임은 세 겹이고 이 파일은 그중 3겹만 맡는다.
// 1겹 상시 idle(호흡·체중이동)과 2겹 자세는 PartnerCharacter.module.css가 가진다.
// 3겹은 주기가 일정하면 어색해지는 움직임이라 여기서 랜덤 타이밍으로 쏜다.
//
// 그림은 움직임이 다른 덩어리(몸·머리·입·팔)마다 SVG를 따로 그려 상자째 움직인다.
// SVG 안쪽 그룹은 합성 레이어가 못 돼서, 숨쉬기·입 하나만 움직여도 매 프레임 캐릭터 전체를 다시 그리기 때문이다.
// 상자는 저마다 제 그림 영역만큼만 잡는다(layer-box.ts) — 상자가 곧 합성 레이어라 크기가 GPU 메모리다.
// 상자는 CSS 픽셀 세계라 SVG 단위 길이는 그 상자 높이 대비 %로 바꿔 쓴다(--box-height = 상자 영역 높이).
//
// 얼굴은 표정 데이터를 불러오면 표정 플레이어가 머리 자리에서 그린다(expression-head.ts). 불러오기 전이나
// 실패하면 원래 머리 층(눈·입 파츠)을 그대로 그린다 — 대화는 표정 없이도 이어진다.
//
// 값은 전부 아래 사양표(BLINKING·NODDING·MIMING)에 모아 두고, 함수는 "언제 쏘는가"만 말한다.
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
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
import {
  createRestingMouth,
  loadExpressionData,
  mimeMouth,
  mountExpressionHead,
  releaseMouth,
  showMouth,
} from './expression-head';
import type { ExpressionData, ExpressionPlayer } from './expression-player';
import {
  clipArea,
  placeArea,
  readArea,
  toViewBox,
  unionAreas,
  type Area,
} from './layer-box';
import styles from './PartnerCharacter.module.css';
import {
  LAYER_AREAS,
  LIMBS,
  PARTS,
  VIEWBOX,
  type PartLayer,
} from './parts-by-partner';

/**
 * partner — 누구를 그릴지. 서버가 내려주는 characterId다.
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
 * depth는 고개가 내려가는 정도(SVG 단위)다 — 정면 2D라 회전을 쓰면 갸우뚱으로 보인다.
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
  drop: [1, 3],
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

/** SVG 단위 길이를 층 상자 높이 대비 %로 바꾸는 함수 */
type ToBoxY = (length: number) => string;

const toBoxY =
  (boxHeight: number): ToBoxY =>
  (length) =>
    `${((length / boxHeight) * 100).toFixed(3)}%`;

/** 움직임을 쏘는 두 상자(머리·입)의 길이 환산 — 상자마다 높이가 달라 따로 바꾼다 */
interface BoxUnits {
  head: ToBoxY;
  mouth: ToBoxY;
}

const HEAD_LAYERS: readonly PartLayer[] = ['head-back', 'mouth', 'head-front'];

/**
 * 상자마다 차지할 영역. 그릴 영역(frame) 밖은 잘라 버린다 — 상반신만 그리는 소비처에서
 * 다리까지 레이어를 잡지 않게. 머리는 세 층을 한 상자에 겹쳐 함께 돌리므로 셋을 합친 영역이고,
 * 입은 머리 상자 안에 놓인다. 그릴 게 없는 상자는 null이다
 */
const layoutBoxes = (partner: Partner, viewBox: string) => {
  const areas = LAYER_AREAS[partner];
  const frame = readArea(viewBox);
  const within = (area: Area | undefined, parent: Area | null) =>
    area && parent ? clipArea(area, parent) : null;
  const headParts = HEAD_LAYERS.flatMap((layer) => areas[layer] ?? []);
  const head = headParts.length ? clipArea(unionAreas(headParts), frame) : null;
  return {
    frame,
    torso: within(areas.torso, frame),
    head,
    mouth: within(areas.mouth, head),
    limbs: LIMBS[partner].map(
      (layer) => [layer, within(areas[layer], frame)] as const,
    ),
  };
};

type Boxes = ReturnType<typeof layoutBoxes>;

const unitsOf = ({ head, mouth }: Boxes): BoxUnits => ({
  head: toBoxY(head?.height ?? 1),
  mouth: toBoxY(mouth?.height ?? 1),
});

/** 상자를 부모 상자 안 제자리에 놓고, 상자 안 CSS 길이 환산에 쓸 높이를 함께 건넨다 */
const boxStyle = (area: Area, parent: Area) =>
  ({
    ...placeArea(area, parent),
    '--box-height': area.height,
  }) as CSSProperties;

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
const nod = (head: Element, depth: number, ms: number, y: ToBoxY) =>
  head.animate(
    [
      { transform: `translateY(${y(0)}) scaleY(1)` },
      { transform: `translateY(${y(-1.5)}) scaleY(1.006)`, offset: 0.18 },
      {
        transform: `translateY(${y(depth * 0.5)}) scaleY(${1 - depth * 0.005})`,
        offset: 0.5,
      },
      {
        transform: `translateY(${y(depth * 0.4)}) scaleY(${1 - depth * 0.004})`,
        offset: 0.66,
      },
      { transform: `translateY(${y(0)}) scaleY(1)` },
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
  y: ToBoxY,
) =>
  mouth.animate(
    [
      { transform: 'scaleY(1)' },
      { transform: `scaleY(${openness}) translateY(${y(drop)})` },
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

/**
 * 모션이 붙는 파츠. 머리·입은 층 상자, 눈·눈썹은 SVG 안 그룹이다 — 깜빡임은 짧은 순간이라
 * 그동안 머리 층만 다시 그리면 된다
 */
const readParts = (root: HTMLElement) => ({
  head: root.querySelector('[data-layer="head-pose"]'),
  mouth: root.querySelector<HTMLElement>('[data-layer="mouth"]'),
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
const keepNodding = (parts: CharacterParts, accents: Accents, y: BoxUnits) => {
  const { head, brows } = parts;
  if (!head) return;

  const nodAgain = () =>
    accents.play(
      nod(head, pick(NODDING.twiceDepth), NODDING.twiceDurationMs, y.head),
    );

  accents.later(() => {
    accents.play(
      nod(head, pick(NODDING.depth), pick(NODDING.durationMs), y.head),
    );
    if (chance(NODDING.twiceChance))
      accents.later(nodAgain, NODDING.twiceDelayMs);
    if (chance(NODDING.browChance))
      brows.forEach((brow) => accents.play(raiseBrow(brow)));
    keepNodding(parts, accents, y);
  }, pick(NODDING.gapMs));
};

/** 맞출 소리가 없을 때 도는 입 흉내 */
const keepMiming = (parts: CharacterParts, accents: Accents, y: BoxUnits) => {
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
            pick(MIMING.drop),
            pick(MIMING.durationMs),
            y.mouth,
          ),
        ),
      index * pick(MIMING.strideMs),
    );
  }
  if (head && chance(MIMING.nodChance))
    accents.play(nod(head, MIMING.nodDepth, MIMING.nodDurationMs, y.head));

  const pause = pick(
    chance(MIMING.longPauseChance) ? MIMING.longPauseMs : MIMING.pauseMs,
  );
  accents.later(
    () => keepMiming(parts, accents, y),
    syllables * MIMING.syllableMs + pause,
  );
};

/**
 * 재생 시각만 읽어 입 상태를 매 프레임 계산해 넘긴다. 소리 경로는 건드리지 않는다.
 * 음량 표는 디코딩이 끝나야 생기고, 그 전까지는 입을 닫아 둔다. 표가 늦거나 실패하면 글자를 고르게 나눠 움직인다.
 * 입을 어디에 그릴지(원래 입 층·표정 머리)는 부르는 쪽이 정한다
 */
// 음량 표를 기다리며 입을 닫아 두는 한도 — 음성 앞머리 무음(약 0.4초)을 넘기면 소리가 나는데 입이 닫혀 있게 된다
const LOUDNESS_WAIT_MS = 500;

const followSpeech = (
  { playback, text }: PlayingSpeech,
  onMouth: (state: MouthState) => void,
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
  };
};

/**
 * 원래 입 층에 소리를 맞춘다. 자세 transition을 끄는 이유 — 켜두면 0.4초 보간이 매 프레임을 서로 취소해 입이 굳는다.
 * 정리할 때 인라인 스타일을 지워 입을 자세 CSS에 돌려준다
 */
const driveMouthLayer = (
  mouth: HTMLElement,
  speech: PlayingSpeech,
  y: ToBoxY,
) => {
  mouth.style.transition = 'none';
  // 같은 값을 다시 쓰면 바뀐 게 없어도 매 프레임 스타일 계산이 돈다 — 쉬는 구간(입 닫힘)이 대부분이라 아낄 게 많다
  let written = '';
  const stop = followSpeech(speech, ({ sx, sy, dy }) => {
    // 원래처럼 SVG 단위 0.1까지만 쓴다 — 더 잘게 쓰면 값이 매 프레임 달라 보여도 그림은 같다
    const transform = `translateY(${y(Number(dy.toFixed(1)))}) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
    if (transform !== written) mouth.style.transform = written = transform;
  });
  return () => {
    stop();
    mouth.style.transform = '';
    mouth.style.transition = '';
  };
};

/** 표정 머리의 입에 소리를 맞춘다. 정리할 때 입을 표정에 돌려준다 */
const driveHeadMouth = (player: ExpressionPlayer, speech: PlayingSpeech) => {
  const stop = followSpeech(speech, (state) => showMouth(player, state));
  return () => {
    stop();
    releaseMouth(player);
  };
};

/**
 * 층 상자의 변형 기준점. 원래 SVG 안에서 각 그룹 자기 영역(fill-box)의 비율로 잡던 점을
 * 같은 자리의 상자 기준 %로 옮긴다(상자 = 제 그림 영역). 머리는 머리 층 그림 전체를 합친 영역이 기준이다.
 * 숨긴 채 그려지면 영역이 0이라 잴 수 없어서, 보이게 될 때(크기가 생길 때) 다시 잰다
 */
const PIVOTS: Array<[layer: string, part: string, at: [number, number]]> = [
  ['torso', '#torso', [0.5, 1]],
  // 층 SVG 요소째 재면 엉뚱한 영역이 나온다 — 원래 #head-inner처럼 안의 그림을 합쳐 잰다
  ['head-pose', 'svg > :not(mask)', [0.5, 0.96]],
  ['mouth', '#mouth', [0.5, 0.15]],
  ['arm-left', '#arm-left', [0.5, 0.04]],
  ['arm-right', '#arm-right', [0.5, 0.04]],
];

const unionOf = (boxes: DOMRect[]) => {
  const left = Math.min(...boxes.map((b) => b.x));
  const top = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.width));
  const bottom = Math.max(...boxes.map((b) => b.y + b.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
};

const placePivots = (root: HTMLElement, boxes: Boxes) => {
  const areaOf = new Map<string, Area | null>([
    ['torso', boxes.torso],
    ['head-pose', boxes.head],
    ['mouth', boxes.mouth],
    ...boxes.limbs,
  ]);
  for (const [layer, part, [atX, atY]] of PIVOTS) {
    const box = root.querySelector<HTMLElement>(`[data-layer="${layer}"]`);
    const frame = areaOf.get(layer);
    if (!frame) continue;
    // 표정 머리를 그릴 땐 보이지 않게 둔 원래 머리 그림으로 잰다 — 표정 데이터엔 크게 늘린 클립 조각이 있어 영역이 부푼다
    const scope = box?.querySelector('[data-measure]') ?? box;
    const shapes = [
      ...(scope?.querySelectorAll<SVGGraphicsElement>(part) ?? []),
    ];
    if (!box || !shapes.length || !('getBBox' in shapes[0])) continue;
    // 숨긴 조각(display:none)은 0,0 점으로 잡혀 영역을 늘린다 — 원래 기준(fill-box)처럼 뺀다
    const drawn = shapes
      .map((shape) => shape.getBBox())
      .filter((area) => area.width || area.height);
    if (!drawn.length) continue;
    const area = unionOf(drawn);
    if (!area.width || !area.height) continue;
    const x = ((area.x + area.width * atX - frame.x) / frame.width) * 100;
    const y = ((area.y + area.height * atY - frame.y) / frame.height) * 100;
    box.style.transformOrigin = `${x.toFixed(3)}% ${y.toFixed(3)}%`;
  }
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
  const frameBox = viewBox ?? VIEWBOX[partner];
  const boxes = layoutBoxes(partner, frameBox);

  // 표정 데이터 — 상대마다 불러온다. 다른 상대의 데이터가 남아 있으면 쓰지 않는다
  const [loaded, setLoaded] = useState<{
    partner: Partner;
    data: ExpressionData;
  } | null>(null);
  const expressionData = loaded?.partner === partner ? loaded.data : null;
  const headHostRef = useRef<HTMLDivElement>(null);
  const headPlayerRef = useRef<ExpressionPlayer | null>(null);
  const restingMouthRef = useRef<ReturnType<typeof createRestingMouth> | null>(
    null,
  );
  // 표정 머리를 새로 띄울 때 지금 표정으로 시작하려고 들고 있는다 — 표정이 바뀔 때마다 다시 띄우지 않는다
  const expressionRef = useRef(expression);
  useEffect(() => {
    expressionRef.current = expression;
  });

  useEffect(() => {
    let alive = true;
    loadExpressionData(partner).then(
      (data) => {
        if (alive) setLoaded({ partner, data });
      },
      (error: unknown) => {
        // 못 받으면 원래 머리 층으로 남는다 — 표정만 빠지고 대화는 이어진다
        if (alive) reportWarning(error, { partner });
      },
    );
    return () => {
      alive = false;
    };
  }, [partner]);

  useEffect(() => {
    const host = headHostRef.current;
    const area = layoutBoxes(partner, frameBox).head;
    if (!host || !expressionData || !area) return;

    const player = mountExpressionHead({
      host,
      data: expressionData,
      area,
      partner,
      expression: expressionRef.current,
      ambient: !stillness,
    });
    const restingMouth = createRestingMouth(player);
    restingMouth.to(expressionRef.current === 'neutral' ? 1 : 0, {
      instant: true,
    });
    headPlayerRef.current = player;
    restingMouthRef.current = restingMouth;
    // 원래 머리 그림이 측정용으로 바뀌었다 — 고개 기준점을 다시 잰다
    const root = rootRef.current;
    if (root) placePivots(root, layoutBoxes(partner, frameBox));

    return () => {
      restingMouth.stop();
      player.stop();
      headPlayerRef.current = null;
      restingMouthRef.current = null;
      host.replaceChildren();
    };
  }, [expressionData, partner, frameBox, stillness]);

  useEffect(() => {
    headPlayerRef.current?.setExpression(expression);
  }, [expression, expressionData]);

  // 표정 머리의 입 — 말하면 소리에, 소리 없이 말하면 음절 흉내에, 쉬면 중립의 쉬는 입(다른 표정이면 표정 입)에 맡긴다
  useEffect(() => {
    const player = headPlayerRef.current;
    const restingMouth = restingMouthRef.current;
    if (!player || !restingMouth) return;

    if (speech) {
      restingMouth.to(0, { instant: true });
      return driveHeadMouth(player, speech);
    }
    if (posture === 'speaking' && !stillness) {
      restingMouth.to(0, { instant: true });
      return mimeMouth(player);
    }
    restingMouth.to(expression === 'neutral' ? 1 : 0);
  }, [
    speech,
    posture,
    stillness,
    expression,
    expressionData,
    partner,
    frameBox,
  ]);

  // 첫 페인트 전에 기준점을 놓는다 — 늦으면 쉬는 입이 엉뚱한 축으로 눌린 채 한 번 그려진다.
  // 표정이 바뀔 때도 다시 잰다 — 찡그린 입 대신 숨은 입은 잴 수 없어, 찡그린 채 처음 그려지면 입 기준점이 비어 있다
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root) placePivots(root, layoutBoxes(partner, frameBox));
  }, [partner, frameBox, posture, expression]);

  // 숨긴 채 그려졌다가 보이게 되면(크기가 생기면) 그때 잰다
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;

    const measured = layoutBoxes(partner, frameBox);
    const observer = new ResizeObserver(() => placePivots(root, measured));
    observer.observe(root);
    return () => observer.disconnect();
  }, [partner, frameBox]);

  // 깜빡임은 원래 머리 층의 눈에 건다 — 표정 머리는 제 데이터 안에서 깜빡인다
  useEffect(() => {
    const root = rootRef.current;
    if (!root || stillness || expressionData) return;

    const accents = createAccents();
    keepBlinking(readParts(root).eyes, accents);

    return () => accents.stopAll();
  }, [partner, stillness, expressionData]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || stillness) return;

    const parts = readParts(root);
    const y = unitsOf(layoutBoxes(partner, frameBox));
    const accents = createAccents();
    if (posture === 'listening') keepNodding(parts, accents, y);
    if (posture === 'speaking' && !speech) keepMiming(parts, accents, y);

    return () => accents.stopAll();
  }, [partner, posture, speech, stillness, frameBox]);

  useEffect(() => {
    const mouth = rootRef.current?.querySelector<HTMLElement>(
      '[data-layer="mouth"]',
    );
    if (!mouth || !speech) return;

    return driveMouthLayer(
      mouth,
      speech,
      unitsOf(layoutBoxes(partner, frameBox)).mouth,
    );
  }, [speech, partner, frameBox]);

  const Parts = PARTS[partner];
  // 층 SVG는 제 상자 영역만 그린다 — 상자가 원래 한 장 안 같은 자리에 놓여 있어 그대로 맞물린다
  const draw = (layer: PartLayer, area: Area) => (
    <Parts
      layer={layer}
      viewBox={toViewBox(area)}
      className={styles.art}
      aria-hidden
    />
  );
  const { frame, torso, head, mouth } = boxes;

  return (
    <div
      ref={rootRef}
      className={[styles.root, styles[posture], styles[expression]]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.sway}>
        {/* 크기를 잡는 빈 그림 — 원래 SVG 한 장이 차지하던 자리를 그대로 차지해 바깥 배치가 달라지지 않는다 */}
        <svg viewBox={frameBox} className={styles.sizer} aria-hidden />
        {torso && (
          <div
            data-layer="torso"
            className={styles.torso}
            style={boxStyle(torso, frame)}
          >
            {draw('torso', torso)}
          </div>
        )}
        {head && (
          <div
            data-layer="head"
            className={styles.head}
            style={boxStyle(head, frame)}
          >
            <div data-layer="head-pose" className={styles.headPose}>
              {expressionData ? (
                <>
                  {/* 원래 머리 그림은 그리지 않고 고개 기준점을 재는 데만 쓴다 */}
                  <div data-measure className={styles.measure}>
                    {draw('head-back', head)}
                    {draw('head-front', head)}
                  </div>
                  <div ref={headHostRef} className={styles.expressionHead} />
                </>
              ) : (
                <>
                  {draw('head-back', head)}
                  {mouth && (
                    <div
                      data-layer="mouth"
                      className={styles.mouth}
                      style={boxStyle(mouth, head)}
                    >
                      {draw('mouth', mouth)}
                    </div>
                  )}
                  {draw('head-front', head)}
                </>
              )}
            </div>
          </div>
        )}
        {boxes.limbs.map(
          ([limb, area]) =>
            area && (
              <div
                key={limb}
                data-layer={limb}
                className={styles.limb}
                style={boxStyle(area, frame)}
              >
                {draw(limb, area)}
              </div>
            ),
        )}
      </div>
    </div>
  );
};
