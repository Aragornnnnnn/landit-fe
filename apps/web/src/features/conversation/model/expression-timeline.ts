// 표정 애니메이션의 키 보간과 층 전환 섞기 — Rive에서 뽑은 키 데이터를 런타임 없이 재생하는 계산부

/** CSS cubic-bezier와 같은 네 수(x1, y1, x2, y2) */
export type Ease = readonly [number, number, number, number];

/** 키 하나 — 프레임, 값, 다음 키까지 잇는 방식, 곡선 */
export type Key = readonly [
  frame: number,
  value: number,
  interp: string,
  ease: Ease | null,
];

/** 진행도(0~1)를 곡선에 통과시킨다. 시간 축(x)을 이분 탐색해 그 자리의 값(y)을 찾는다 */
export const cubicBezier = ([x1, y1, x2, y2]: Ease) => {
  const at = (a: number, b: number, t: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 24; i++) {
      t = (lo + hi) / 2;
      if (at(x1, x2, t) < x) lo = t;
      else hi = t;
    }
    return at(y1, y2, t);
  };
};

/** 프레임 위치의 값. 각 구간은 시작 키의 방식(멈춤·직선·곡선)을 따른다 */
export const valueAt = (keys: readonly Key[], frame: number) => {
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0, interp, ease] = keys[i];
    const [f1, v1] = keys[i + 1];
    if (frame >= f1) continue;
    if (interp === 'hold') return v0;
    const progress = (frame - f0) / (f1 - f0);
    const eased =
      interp === 'cubic' && ease ? cubicBezier(ease)(progress) : progress;
    return v0 + (v1 - v0) * eased;
  }
  return keys[keys.length - 1][1];
};

/**
 * 층이 다른 애니메이션으로 넘어갈 때 이전 값과 새 값을 섞는다.
 * 한쪽에만 있는 값은 기본값과 섞는다 — 그러지 않으면 새 표정에 없는 값이 전환 첫 프레임에 튄다
 */
export const mixFrames = (
  from: ReadonlyMap<string, number>,
  to: ReadonlyMap<string, number>,
  base: ReadonlyMap<string, number>,
  mix: number,
) => {
  const mixed = new Map<string, number>();
  for (const key of new Set([...from.keys(), ...to.keys()])) {
    const fallback = base.get(key) ?? 0;
    const a = from.get(key) ?? fallback;
    const b = to.get(key) ?? fallback;
    mixed.set(key, a + (b - a) * mix);
  }
  return mixed;
};
