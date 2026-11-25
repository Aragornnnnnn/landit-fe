// Rive에서 뽑은 캐릭터 SVG와 애니메이션 데이터를 재생하는 플레이어 — 표정 전환·깜빡임·숨쉬기·입 모핑·움직이는 클립
import {
  cubicBezier,
  mixFrames,
  valueAt,
  type Ease,
  type Key,
} from '../../model/expression-timeline';

interface Track {
  t: string;
  p: string;
  k: Key[];
}
interface Anim {
  dur: number;
  fps: number;
  loop: boolean;
  tracks: Track[];
}
interface Rule {
  anim: string;
  reset: boolean;
  dur: number;
  ease: Ease | null;
}
interface Layer {
  name: string;
  default: string;
  rules: Record<string, Rule>;
}
interface Vert {
  t: string;
  x: number;
  y: number;
  rotation: number;
  distance: number;
  inRotation: number;
  inDistance: number;
  outRotation: number;
  outDistance: number;
}
type Target =
  | { el: string; kind: 'xf'; base: Record<string, number> }
  | { el: string; kind: 'vert'; i: number }
  | { el: string; kind: 'stroke'; i: number };

/** 변환기(rml2svg.py)가 만드는 데이터 */
export interface ExpressionData {
  viewBox: string;
  names: Record<string, string>;
  svg: string;
  targets: Record<string, Target>;
  morph: Record<string, { closed: boolean; verts: Vert[] }>;
  clips: Array<{ ref: string; pieces: Array<{ el: string; src: string }> }>;
  anims: Record<string, Anim>;
  layers: Layer[];
}

/** 계속 도는 층 — 모션을 줄이는 설정에서는 멈춘다 */
const AMBIENT_LAYERS = new Set(['Breathe', 'Blink']);

// url(#id)는 문서 전체에서 찾으니, 같은 그림이 두 번 뜨면 클립·그라데이션이 첫 그림 것을 가리킨다
let instances = 0;
const scopeIds = (svg: string, prefix: string) =>
  svg
    .replace(/\bid="([^"]+)"/g, `id="${prefix}$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`);

const handles = (v: Vert): [[number, number], [number, number]] => {
  const { x, y } = v;
  if (v.t === 'CubicDetachedVertex')
    return [
      [
        x + Math.cos(v.inRotation) * v.inDistance,
        y + Math.sin(v.inRotation) * v.inDistance,
      ],
      [
        x + Math.cos(v.outRotation) * v.outDistance,
        y + Math.sin(v.outRotation) * v.outDistance,
      ],
    ];
  if (v.t === 'CubicMirroredVertex') {
    const c = Math.cos(v.rotation) * v.distance;
    const s = Math.sin(v.rotation) * v.distance;
    return [
      [x - c, y - s],
      [x + c, y + s],
    ];
  }
  return [
    [x, y],
    [x, y],
  ];
};

const pathOf = (verts: Vert[], closed: boolean) => {
  const r = (n: number) => n.toFixed(2);
  let d = `M${r(verts[0].x)} ${r(verts[0].y)}`;
  const last = closed ? verts.length : verts.length - 1;
  for (let j = 1; j <= last; j++) {
    const [, out] = handles(verts[j - 1]);
    const next = verts[j % verts.length];
    const [into] = handles(next);
    d += `C${r(out[0])} ${r(out[1])} ${r(into[0])} ${r(into[1])} ${r(next.x)} ${r(next.y)}`;
  }
  return closed ? `${d}Z` : d;
};

interface LayerState {
  name: string;
  anim: string;
  time: number;
  from: Map<string, number> | null;
  mix: number;
  dur: number;
  ease: (x: number) => number;
  out: Map<string, number>;
}

/**
 * 이름 붙은 파츠 값에 얹는 조정 — set은 덮어쓰고 add는 더한다.
 * scale은 애니메이션이 기본값에서 벗어난 폭만 줄이고, max는 결과가 넘지 않을 상한이다
 */
export interface Adjust {
  set?: number;
  add?: number;
  scale?: number;
  max?: number;
}

export class ExpressionPlayer {
  private readonly data: ExpressionData;
  private readonly svg: SVGSVGElement;
  private readonly els = new Map<string, Element>();
  private readonly base = new Map<string, number>();
  private readonly values = new Map<string, number>();
  private readonly vertRid = new Map<string, string>();
  private readonly layers: LayerState[];
  private readonly ambient: boolean;
  private readonly prefix = `xp${++instances}-`;
  private adjusts = new Map<string, Adjust>();
  private frame = 0;
  private last = 0;

  /** 매 프레임 그리기 직전에 불린다 — 끄덕임·립싱크처럼 바깥에서 얹는 움직임을 여기서 정한다 */
  onFrame: ((dt: number) => void) | null = null;

  constructor(
    host: HTMLElement,
    data: ExpressionData,
    { ambient = true } = {},
  ) {
    this.data = data;
    this.ambient = ambient;
    host.innerHTML = scopeIds(data.svg, this.prefix);
    this.svg = host.querySelector('svg')!;
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');
    for (const [rid, target] of Object.entries(data.targets)) {
      if (!this.els.has(target.el)) {
        const el = this.byId(target.el);
        if (el) this.els.set(target.el, el);
      }
      if (target.kind === 'xf')
        for (const [k, v] of Object.entries(target.base))
          this.base.set(`${rid}|${k}`, v);
      if (target.kind === 'vert') {
        this.vertRid.set(`${target.el}#${target.i}`, rid);
        const vert = data.morph[target.el].verts[target.i];
        for (const k of ['x', 'y', 'rotation', 'distance'] as const)
          this.base.set(`${rid}|${k}`, vert[k]);
      }
      if (target.kind === 'stroke') {
        const path = this.els
          .get(target.el)
          ?.querySelector(`[data-p="${target.i}"]`);
        this.base.set(
          `${rid}|thickness`,
          Number(path?.getAttribute('stroke-width') ?? 1),
        );
      }
    }
    this.layers = data.layers.map((layer) => ({
      name: layer.name,
      anim: layer.default,
      time: 0,
      from: null,
      mix: 1,
      dur: 0,
      ease: (x: number) => x,
      out: new Map(),
    }));
  }

  get element() {
    return this.svg;
  }

  /** 이름 붙은 파츠(머리·몸통 등)가 그려진 요소. 이름표에 없으면 null */
  part(name: string) {
    const target = this.data.targets[this.data.names[name]];
    return target ? this.byId(target.el) : null;
  }

  private byId(id: string) {
    return this.svg.querySelector(`[id="${this.prefix}${id}"]`);
  }

  /** 표정을 바꾼다. 층마다 지금 그리던 값에서 새 애니메이션으로 섞어 넘어간다 */
  setExpression(expression: string, { instant = false } = {}) {
    this.data.layers.forEach((layer, i) => {
      const rule = layer.rules[expression];
      const state = this.layers[i];
      if (!rule || rule.anim === state.anim) return;
      state.from = instant ? null : new Map(state.out);
      state.anim = rule.anim;
      if (rule.reset) state.time = 0;
      state.mix = instant || !rule.dur ? 1 : 0;
      state.dur = rule.dur / 1000;
      state.ease = rule.ease ? cubicBezier(rule.ease) : (x) => x;
    });
  }

  /** 이름 붙은 파츠(입·머리 등)의 값을 바깥에서 조정한다. null이면 조정을 걷는다 */
  adjust(name: string, prop: string, value: Adjust | null) {
    const rid = this.data.names[name];
    if (!rid) return;
    const key = `${rid}|${prop}`;
    if (value) this.adjusts.set(key, value);
    else this.adjusts.delete(key);
  }

  start() {
    const loop = (now: number) => {
      const dt = this.last ? Math.min((now - this.last) / 1000, 0.05) : 0;
      this.last = now;
      this.step(dt);
      this.frame = requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.frame);
    this.last = 0;
  }

  /** 시간을 dt초 진행하고 그린다 */
  step(dt: number) {
    this.onFrame?.(dt);
    const frameVals = new Map<string, number>();
    for (const state of this.layers) {
      if (this.ambient || !AMBIENT_LAYERS.has(state.name)) state.time += dt;
      const anim = this.data.anims[state.anim];
      const raw = state.time * anim.fps;
      const f = anim.loop ? raw % anim.dur : Math.min(raw, anim.dur);
      const current = new Map<string, number>();
      for (const track of anim.tracks)
        current.set(`${track.t}|${track.p}`, valueAt(track.k, f));
      let out = current;
      if (state.from && state.mix < 1) {
        state.mix = Math.min(1, state.mix + (state.dur ? dt / state.dur : 1));
        out = mixFrames(state.from, current, this.base, state.ease(state.mix));
      } else state.from = null;
      state.out = out;
      for (const [k, v] of out) frameVals.set(k, v);
    }
    // 이번 프레임에 아무 층도 안 그린 값(걷힌 조정 등)은 기본값으로 돌려놓는다
    for (const key of this.values.keys())
      if (!frameVals.has(key)) frameVals.set(key, this.base.get(key) ?? 0);
    for (const [key, adj] of this.adjusts) {
      const base = this.base.get(key) ?? 0;
      const animated = frameVals.get(key) ?? base;
      const narrowed =
        adj.scale === undefined
          ? animated
          : base + (animated - base) * adj.scale;
      const value = (adj.set ?? narrowed) + (adj.add ?? 0);
      frameVals.set(
        key,
        adj.max === undefined ? value : Math.min(adj.max, value),
      );
    }
    this.render(frameVals);
  }

  private render(frameVals: Map<string, number>) {
    const dirtyXf = new Set<string>();
    const dirtyMorph = new Set<string>();
    for (const [key, value] of frameVals) {
      if (this.values.get(key) === value) continue;
      this.values.set(key, value);
      const rid = key.slice(0, key.indexOf('|'));
      const target = this.data.targets[rid];
      if (!target) continue;
      if (target.kind === 'xf') dirtyXf.add(rid);
      else if (target.kind === 'vert') dirtyMorph.add(target.el);
      else
        this.els
          .get(target.el)
          ?.querySelector(`[data-p="${target.i}"]`)
          ?.setAttribute('stroke-width', value.toFixed(2));
    }
    const val = (rid: string, k: string) =>
      this.values.get(`${rid}|${k}`) ?? this.base.get(`${rid}|${k}`) ?? 0;
    for (const rid of dirtyXf) {
      const el = this.els.get(this.data.targets[rid].el);
      if (!el) continue;
      el.setAttribute(
        'transform',
        `translate(${val(rid, 'x').toFixed(3)} ${val(rid, 'y').toFixed(3)}) rotate(${((val(rid, 'rotation') * 180) / Math.PI).toFixed(3)}) scale(${val(rid, 'scaleX').toFixed(4)} ${val(rid, 'scaleY').toFixed(4)})`,
      );
      el.setAttribute('opacity', val(rid, 'opacity').toFixed(3));
    }
    for (const el of dirtyMorph) {
      const shape = this.data.morph[el];
      const verts = shape.verts.map((v, i) => {
        const rid = this.vertRid.get(`${el}#${i}`);
        return rid
          ? {
              ...v,
              x: val(rid, 'x'),
              y: val(rid, 'y'),
              rotation: val(rid, 'rotation'),
              distance: val(rid, 'distance'),
            }
          : v;
      });
      const d = pathOf(verts, shape.closed);
      this.els
        .get(el)
        ?.querySelectorAll('path')
        .forEach((p) => p.setAttribute('d', d));
    }
    this.syncClips();
  }

  /** 움직이는 클립 — 클립 도형을 원본 도형이 지금 있는 자리로 옮긴다 */
  private syncClips() {
    for (const clip of this.data.clips) {
      const ref = this.byId(clip.ref) as SVGGraphicsElement | null;
      const inverse = ref?.getCTM?.()?.inverse();
      if (!inverse) continue;
      for (const piece of clip.pieces) {
        const src = this.byId(piece.src) as SVGGraphicsElement | null;
        const m = src?.getCTM?.();
        if (!m) continue;
        const r = inverse.multiply(m);
        this.byId(piece.el)?.setAttribute(
          'transform',
          `matrix(${r.a} ${r.b} ${r.c} ${r.d} ${r.e} ${r.f})`,
        );
      }
    }
  }
}
