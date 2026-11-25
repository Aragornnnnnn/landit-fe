// 표정 데이터에서 머리 묶음만 전신 층의 머리 자리에 재생한다 — 몸·팔·다리·숨쉬기·고개 자세는 전신 층이 맡는다
//
// 표정 데이터(Rive 변환)는 원래 상반신 한 장이라 몸통·팔까지 들어 있다. 전신 무대는 몸을 층 상자로 따로 그리므로
// 여기서는 머리(와 몸통·머리 사이의 클로이 뒷머리)만 남기고, 전신 몸통 위에 얹혀도 어긋나지 않게 고개 움직임을 다듬는다.
import type { Partner } from '../../model/character-look';
import { closedMouth, type MouthState } from '../../model/lipsync';
import { ExpressionPlayer, type ExpressionData } from './expression-player';
import { HAIR_GAPS, type HairGaps } from './hair-gaps';
import { toViewBox, type Area } from './layer-box';

/** 상대별 표정 데이터 — 화면에 그 상대가 나올 때만 불러온다 */
const LOADERS: Record<Partner, () => Promise<{ default: unknown }>> = {
  chloe: () => import('./expressions/chloe.json'),
  marco: () => import('./expressions/marco.json'),
  teddy: () => import('./expressions/teddy.json'),
};

export const loadExpressionData = (partner: Partner) =>
  LOADERS[partner]().then((m) => m.default as ExpressionData);

/**
 * 표정이 고개를 돌리고 옮기는 폭. 표정 데이터의 고개 움직임은 원래 몸통의 목까지 함께 움직이는 전제라,
 * 따로 그린 전신 몸통 위에서 크게 돌면 목 그림자가 기울어 비뚤어 보인다. 테디 원래 폭(최대 약 1도)에 맞춘다
 * (원래 최대 회전: 마르코 0.08rad, 클로이 0.024rad, 테디 0.02rad)
 */
const HEAD_TURN_SCALE: Record<Partner, number> = {
  marco: 0.25,
  chloe: 0.8,
  teddy: 1,
};

const SVG_NS = 'http://www.w3.org/2000/svg';
// url(#id)는 문서 전체에서 찾는다 — 같은 화면에 머리가 둘 떠도 마스크가 섞이지 않게 문서 단위로 번호를 매긴다
let maskCount = 0;
// 마스크 영역 — 머리가 어디로 움직여도 덮도록 넉넉히
const MASK_AREA = { x: '-10000', y: '-10000', width: '20000', height: '20000' };

const setAttributes = (el: Element, attributes: Record<string, string>) => {
  for (const [key, value] of Object.entries(attributes))
    el.setAttribute(key, value);
};

/** 몸통과 머리 뒤에 오는 형제(팔)는 전신 층이 그린다 — 감춘다. 몸통과 머리 사이(클로이 뒷머리)는 남긴다 */
const hideBody = (head: Element, torso: Element) => {
  let afterHead = false;
  for (const sibling of head.parentElement?.children ?? []) {
    if (sibling === head) afterHead = true;
    else if (sibling === torso || afterHead)
      (sibling as SVGElement).style.display = 'none';
  }
};

/** 머리카락 틈을 다시 판다 — 구멍 자리를 검게 판 마스크를 머리와 뒷머리에 걸고, 틈을 두른 가닥을 제 구멍만 판 채로 얹는다 */
const cutHairGaps = (
  svg: SVGSVGElement,
  { holes, strands }: HairGaps,
  inner: Element,
  torso: Element,
  head: Element,
) => {
  const defs = svg.querySelector('defs') ?? svg;
  const maskOf = (cut: readonly string[]) => {
    const mask = document.createElementNS(SVG_NS, 'mask');
    mask.id = `hair-gaps-${++maskCount}`;
    setAttributes(mask, { maskUnits: 'userSpaceOnUse', ...MASK_AREA });
    const keep = document.createElementNS(SVG_NS, 'rect');
    setAttributes(keep, { ...MASK_AREA, fill: 'white' });
    mask.append(keep);
    for (const d of cut) {
      const hole = document.createElementNS(SVG_NS, 'path');
      setAttributes(hole, { d, fill: 'black' });
      mask.append(hole);
    }
    defs.append(mask);
    return `url(#${mask.id})`;
  };

  const allHoles = maskOf(holes);
  inner.setAttribute('mask', allHoles);
  // 몸통과 머리 사이의 뒷머리도 같은 자리가 비어야 한다 — 앞머리만 파면 뒷머리가 틈을 다시 메운다
  for (
    let between = torso.nextElementSibling;
    between && between !== head;
    between = between.nextElementSibling
  )
    between.setAttribute('mask', allHoles);

  // 가닥은 머리와 함께 움직이게 머리 안, 안쪽 그림과 같은 좌표에 둔다
  for (const strand of strands) {
    const group = document.createElementNS(SVG_NS, 'g');
    setAttributes(group, {
      transform: inner.getAttribute('transform') ?? '',
      mask: maskOf(strand.holes.map((index) => holes[index])),
    });
    const path = document.createElementNS(SVG_NS, 'path');
    setAttributes(path, { d: strand.d, fill: strand.fill });
    group.append(path);
    inner.parentElement?.append(group);
  }
};

/**
 * 머리 자리(area)에 표정 머리를 띄운다. 플레이어는 바로 돌기 시작하고, 정리는 호출한 쪽이 stop()으로 한다
 */
export const mountExpressionHead = ({
  host,
  data,
  area,
  partner,
  expression,
  ambient,
}: {
  host: HTMLElement;
  data: ExpressionData;
  area: Area;
  partner: Partner;
  expression: string;
  ambient: boolean;
}) => {
  const player = new ExpressionPlayer(host, data, { ambient });
  const svg = player.element;
  // 머리 자리만 그리고, 그 밖으로 나가는 효과(분노 표시·하트)는 자르지 않는다
  setAttributes(svg, { viewBox: toViewBox(area), overflow: 'visible' });

  const head = player.part('head');
  const torso = player.part('torso');
  const inner = player.part('head-inner');
  if (head && torso) hideBody(head, torso);
  const gaps = HAIR_GAPS[partner];
  if (gaps && head && torso && inner)
    cutHairGaps(svg, gaps, inner, torso, head);

  const headTarget = data.targets[data.names.head];
  if (headTarget?.kind === 'xf') {
    const scale = HEAD_TURN_SCALE[partner];
    player.adjust('head', 'rotation', { scale });
    player.adjust('head', 'x', { scale });
    // 숙이는 표정이어도 원래 자리 아래로는 내려가지 않는다 — 몸통이 따로라 목선이 깃 밖으로 빠진다
    player.adjust('head', 'y', { scale, max: headTarget.base.y });
  }
  // 떠오름은 전신 층의 머리 상자가 이미 한다 — 플레이어의 머리 숨쉬기는 꺼서 두 번 뜨지 않게
  const innerTarget = data.targets[data.names['head-inner']];
  if (innerTarget?.kind === 'xf')
    player.adjust('head-inner', 'y', { set: innerTarget.base.y });

  player.setExpression(expression, { instant: true });
  player.start();
  return player;
};

// 표정 입(다문 입·이 악문 입·삐진 입) — 말하거나 쉬는 입을 보일 땐 감춘다
const MOUTH_SWAPS = ['mouth-line', 'mouth-grit', 'mouth-pout'] as const;

/** 말하는 입 — 원래 그림의 벌린 입을 상태만큼 벌리고, 표정 입은 감춘다 */
export const showMouth = (
  player: ExpressionPlayer,
  { sx, sy, dy }: MouthState,
  opacity = 1,
) => {
  player.adjust('mouth-open', 'opacity', { set: opacity });
  player.adjust('mouth-open', 'scaleX', { set: sx });
  player.adjust('mouth-open', 'scaleY', { set: sy });
  player.adjust('mouth-open', 'y', { add: dy });
  for (const name of MOUTH_SWAPS)
    player.adjust(name, 'opacity', { set: 1 - opacity });
};

/** 입을 표정에 돌려준다 */
export const releaseMouth = (player: ExpressionPlayer) => {
  for (const prop of ['opacity', 'scaleX', 'scaleY', 'y'])
    player.adjust('mouth-open', prop, null);
  for (const name of MOUTH_SWAPS) player.adjust(name, 'opacity', null);
};

/** 맞출 소리가 없을 때 도는 입 흉내 — 음절을 몰아 쏘고 구절 사이에 쉰다. 시간은 초 */
const MIMING = {
  syllable: [0.2, 0.3],
  open: [0.35, 0.75],
  syllables: [2, 5],
  pause: [0.35, 0.65],
  longPause: [0.35, 1.3],
  longPauseChance: 0.25,
} as const;

const pick = ([min, max]: readonly [number, number]) =>
  min + Math.random() * (max - min);

/** 소리 없이 말하는 동안 음절을 흉내 낸다. 멈추는 함수를 돌려준다 */
export const mimeMouth = (player: ExpressionPlayer) => {
  let mouth = { ...closedMouth };
  let target = closedMouth.sy;
  let left = 0;
  let syllables = 0;
  let last = 0;
  let frame = 0;
  const tick = (now: number) => {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    left -= dt;
    if (left <= 0 && syllables > 0) {
      syllables -= 1;
      target = pick(MIMING.open);
      left = pick(MIMING.syllable);
    } else if (left <= 0) {
      syllables = Math.round(pick(MIMING.syllables));
      target = closedMouth.sy;
      left = pick(
        Math.random() < MIMING.longPauseChance
          ? MIMING.longPause
          : MIMING.pause,
      );
    }
    // 음절 끝에서 입을 다시 오므려야 연달아 말하는 것처럼 보인다
    const goal = left < 0.1 ? closedMouth.sy : target;
    const sy = mouth.sy + (goal - mouth.sy) * Math.min(1, dt * 18);
    mouth = { sx: 0.9, sy, dy: (sy - 0.4) * 5 };
    showMouth(player, mouth);
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(frame);
    releaseMouth(player);
  };
};

/**
 * 중립의 쉬는 입 — 지금 무대의 쉬는 입(원래 웃는 입을 눌러 만든 미소)과 같은 값이다.
 * 표정 데이터의 중립은 다문 미소라, 중립일 때만 이 입으로 바꿔 원래 인상을 지킨다
 */
const RESTING_MOUTH: MouthState = { sx: 0.84, sy: 0.4, dy: 3 };
// 표정 전환(표정 데이터의 섞기 480ms)과 같은 시간 — 입만 툭 바뀌지 않게
const REST_BLEND_MS = 480;

/** 쉬는 입을 표정 입과 섞어 넘긴다. to(1)이면 쉬는 입으로, to(0)이면 표정 입으로 */
export const createRestingMouth = (player: ExpressionPlayer) => {
  let weight = 0;
  let target = 0;
  let frame = 0;
  let last = 0;
  const apply = () => {
    if (weight <= 0) return releaseMouth(player);
    const eased = weight * weight * (3 - 2 * weight);
    showMouth(player, RESTING_MOUTH, eased);
  };
  const tick = (now: number) => {
    const step = last ? (now - last) / REST_BLEND_MS : 0;
    last = now;
    weight =
      target > weight
        ? Math.min(target, weight + step)
        : Math.max(target, weight - step);
    apply();
    frame = weight === target ? 0 : requestAnimationFrame(tick);
  };
  return {
    to: (next: number, { instant = false } = {}) => {
      target = next;
      if (instant) {
        cancelAnimationFrame(frame);
        frame = 0;
        weight = next;
        apply();
        return;
      }
      if (frame) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    },
    stop: () => {
      cancelAnimationFrame(frame);
      frame = 0;
    },
  };
};
