// 피그마 벡터화 캐릭터 SVG를 파츠 그룹으로 재조립해 React 컴포넌트로 뽑는 생성기
// 실행: pnpm --filter web characters
//
// 원본(assets/character/*.svg)은 이름 없는 <path> 나열이라 그대로는 파츠를 움직일 수 없다.
// path의 id(Vector_N)로 피그마 노드 번호를 역산해 슬라이스에 배정하고, 모션 코드가 부를
// 그룹 이름(#head, #mouth …)을 붙인다. 캐릭터가 늘어나면 CHARACTERS에 설정만 추가하면 된다.
import { readFileSync, writeFileSync } from 'node:fs';

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// slices 정의 순서가 곧 z순서(문서 순서)라 임의로 바꾸면 그림이 달라진다.
// headParts는 head > head-inner 래퍼 안에 들어갈 슬라이스로, slices에서 연속이어야 한다.
// viewBox는 대화 무대에 맞춘 상체 크롭이다 — 허리 위(y 650)에서 끊어 얼굴을 키운다.
// 두 캐릭터가 같은 크롭을 쓰는 이유는 머리 크기·위치가 거의 같아서다(마르코 81~446, 클로이 84~442).
// 크롭 밖으로 나가는 하반신은 slices에서 아예 뺐다.
const CHARACTERS = {
  marco: {
    src: 'male.svg',
    out: 'MarcoParts.tsx',
    component: 'MarcoParts',
    label: '마르코',
    base: 124,
    viewBox: '292 40 440 610',
    // 목(208)은 머리가 아니라 몸통에 붙인다 — 머리 회전 시 목이 따라가면 잘린 것처럼 보인다.
    // 하반신(125~153)은 벨트부터 시작해 전부 크롭 밖이라 뺐다
    slices: [
      ['torso', [...range(154, 184), 208]],
      ['hair', range(185, 206)],
      ['face', range(207, 219).filter((n) => n !== 208 && n !== 214)],
      ['mouth', range(220, 225)],
      ['eye-left', range(226, 232)],
      ['eye-right', range(233, 238)],
      ['brow-right', [214]],
      ['brow-left', range(239, 240)],
      ['nose', range(241, 243)],
      ['chin', [244]],
      ['arm-right', range(245, 253)],
      ['arm-left', range(254, 263)],
    ],
    headParts: [
      'hair',
      'face',
      'mouth',
      'eye-left',
      'eye-right',
      'brow-right',
      'brow-left',
      'nose',
      'chin',
    ],
    // 표정용 수제 벡터 — 트랜스폼으로는 형태를 못 바꾸므로 따로 그려 두고 상태에 따라 교체한다.
    // 색은 원본 파츠에서 그대로 뽑아 써야 덧그린 티가 안 난다
    extras: {
      'eye-left': [
        '<path id="eye-left-happy" d="M432 298 Q450 280 468 298" stroke="#2B2019" stroke-width="7" stroke-linecap="round" fill="none"/>',
      ],
      'eye-right': [
        '<path id="eye-right-happy" d="M529 298 Q547 280 565 298" stroke="#2B2019" stroke-width="7" stroke-linecap="round" fill="none"/>',
      ],
      mouth: [
        '<path id="mouth-frown" d="M484 364 Q502 353 520 364" stroke="#5C321C" stroke-width="6" stroke-linecap="round" fill="none"/>',
      ],
    },
  },
  teddy: {
    src: 'teddy.svg',
    out: 'TeddyParts.tsx',
    component: 'TeddyParts',
    label: '테디 (제3자 곰)',
    // 단순 도형 캐릭터라 id 없이 문서 순서로 가른다. 몸통 실루엣이 path 하나(머리 포함)라
    // 머리를 따로 못 움직인다 — 얼굴 클러스터를 head-inner로 묶어 끄덕임을 얼굴 움직임으로 낸다
    byIndex: true,
    viewBox: '40 20 865 790',
    slices: [
      ['torso', range(0, 8)],
      ['muzzle', [9]],
      ['nose', [10]],
      ['eye-left', [11]],
      ['eye-right', [12]],
      ['mouth', range(13, 15)],
    ],
    headParts: ['muzzle', 'nose', 'eye-left', 'eye-right', 'mouth'],
    extras: {
      'eye-left': [
        '<path id="eye-left-happy" d="M355 340 Q378 316 401 340" stroke="#1B1817" stroke-width="14" stroke-linecap="round" fill="none"/>',
        '<path id="frown-brow-left" d="M348 274 L402 296" stroke="#1B1817" stroke-width="13" stroke-linecap="round" fill="none"/>',
      ],
      'eye-right': [
        '<path id="eye-right-happy" d="M505 340 Q528 316 551 340" stroke="#1B1817" stroke-width="14" stroke-linecap="round" fill="none"/>',
        '<path id="frown-brow-right" d="M558 274 L504 296" stroke="#1B1817" stroke-width="13" stroke-linecap="round" fill="none"/>',
      ],
      mouth: [
        '<path id="mouth-frown" d="M432 486 Q455 470 478 486" stroke="#762A16" stroke-width="10" stroke-linecap="round" fill="none"/>',
      ],
    },
  },
  chloe: {
    src: 'female.svg',
    out: 'ChloeParts.tsx',
    component: 'ChloeParts',
    label: '클로이',
    base: 458,
    viewBox: '292 40 440 610',
    // 몸통·팔·바지가 한 덩어리로 트레이스됐다. 목은 턱 음영이 깊게 겹쳐 head에 둬도 안전하다
    slices: [
      ['torso', range(459, 508)],
      ['hair-back', [509]],
      ['face', range(510, 517)],
      ['brow-right', [518]],
      ['brow-left', [519]],
      ['face-side', range(520, 523)],
      ['eye-right', range(524, 526)],
      ['eye-left', range(527, 529)],
      ['mouth', range(530, 533)],
      ['blush', range(534, 535)],
      ['nose', range(536, 538)],
      ['hair-front', range(539, 588)],
    ],
    // 벡터화 때 배경(#FDFCFC)이 도형으로 같이 잡혔다 — 어두운 바탕 위에서 흰 얼룩으로 드러난다.
    // 팔 옆 조각(478·479·486)은 그냥 뺀다. 머리카락 틈 조각(544·559)은 자기보다 앞에 그려진 머리·얼굴을
    // 가려 틈을 내던 것이라, 빼면 뒷머리가 드러나 머리가 두꺼워진다 — 대신 같은 자리를 구멍(마스크)으로
    // 파서 배경이 비치게 한다. 눈 흰자(524·527)·이(531)는 같은 색이지만 진짜 흰색이라 남긴다
    omit: [478, 479, 486],
    holes: [544, 559],
    headParts: [
      'hair-back',
      'face',
      'brow-right',
      'brow-left',
      'face-side',
      'eye-right',
      'eye-left',
      'mouth',
      'blush',
      'nose',
      'hair-front',
    ],
    // 원본 입꼬리 축이 -7.5도 기울어 있어, 누르면 기울기가 과장돼 삐뚤어져 보인다.
    // 런타임 보정 대신 반대 회전을 그룹에 구워 애초에 수평인 입으로 만든다
    bake: { mouth: 'rotate(7.5 506.2 313)' },
    extras: {
      'eye-left': [
        '<path id="eye-left-happy" d="M435 267 Q453 248 471 267" stroke="#3A2013" stroke-width="6.5" stroke-linecap="round" fill="none"/>',
      ],
      'eye-right': [
        '<path id="eye-right-happy" d="M529 258 Q548 239 567 258" stroke="#3A2013" stroke-width="6.5" stroke-linecap="round" fill="none"/>',
      ],
      mouth: [
        '<path id="mouth-frown" d="M489 325 Q505 315 521 325" stroke="#762A16" stroke-width="5.5" stroke-linecap="round" fill="none"/>',
      ],
    },
  },
};

// SVG 속성을 JSX 표기로 옮긴다 (stroke-width → strokeWidth)
const toJsx = (tag) =>
  tag
    .replace(
      /\b(stroke|fill|clip|stop|font)-([a-z])/g,
      (_, a, b) => a + b.toUpperCase(),
    )
    .replace(/\bclass=/g, 'className=');

for (const [name, cfg] of Object.entries(CHARACTERS)) {
  const src = readFileSync(
    new URL(`../assets/character/${cfg.src}`, import.meta.url),
    'utf8',
  );
  // 좌표를 소수 둘째 자리로 줄인다 — 눈에 안 보이는 차이로 파일이 꽤 작아진다
  const paths = (src.match(/<path\b[^>]*?(?:\/>|>\s*<\/path>)/g) ?? []).map(
    (p) =>
      p.replace(/-?\d+\.\d+/g, (m) =>
        String(Math.round(Number(m) * 100) / 100),
      ),
  );

  const sliceOf = new Map();
  for (const [sliceName, ids] of cfg.slices)
    for (const id of ids) sliceOf.set(id, sliceName);

  const buckets = new Map(cfg.slices.map(([n]) => [n, []]));
  // 구멍 — 노드 번호별 경로와, 그 구멍이 어느 슬라이스의 몇 번째 자리에 있었는지(그 앞의 것만 가린다)
  const holes = [];
  if (cfg.byIndex) {
    // 순서 기반 — id 없이 내보낸 단순 캐릭터용. slices의 번호가 문서 순서(0부터)다
    paths.forEach((p, index) => {
      const slice = sliceOf.get(index);
      if (slice) buckets.get(slice).push(p);
    });
  } else {
    // id 기반 — 문서 순서대로 슬라이스에 담는다. id 없는 path는 직전 path를 따라간다
    // (피그마에서 수동 보정된 조각들로, 앞 도형의 음영이라 같은 그룹이 맞다)
    const omit = new Set(cfg.omit ?? []);
    const holeSet = new Set(cfg.holes ?? []);
    // 설정한 노드가 하나도 안 걸리면 조용히 넘어가지 않는다 — 재export로 번호가 밀리면 흰 얼룩이 소리 없이 돌아온다
    const matched = new Set();
    let prevSlice = null;
    for (const p of paths) {
      const m = p.match(/id="Vector(?:_(\d+))?"/);
      const node = m ? cfg.base + (m[1] ? Number(m[1]) - 1 : 0) : null;
      const slice = node !== null ? sliceOf.get(node) : prevSlice;
      // 빼거나 구멍으로 쓰는 경로도 "직전 경로"다 — 뒤따르는 id 없는 조각이 그 슬라이스를 물려받아야 한다
      prevSlice = slice ?? prevSlice;
      if (node !== null && omit.has(node)) {
        matched.add(node);
        continue;
      }
      if (node !== null && holeSet.has(node)) {
        matched.add(node);
        if (!/\bfill="/.test(p))
          throw new Error(
            `${name}: 구멍 ${node}에 fill이 없어 마스크로 못 쓴다`,
          );
        if (slice)
          holes.push({ node, path: p, slice, at: buckets.get(slice).length });
        continue;
      }
      if (slice) buckets.get(slice).push(p);
    }
    const missing = [...omit, ...holeSet].filter((n) => !matched.has(n));
    if (missing.length)
      throw new Error(`${name}: omit/holes에 없는 노드 ${missing.join(', ')}`);
  }

  const headSet = new Set(cfg.headParts);
  const sliceIndex = new Map(cfg.slices.map(([n], i) => [n, i]));

  // 어떤 경로(슬라이스 s의 j번째)를 가리는 구멍들 — 문서 순서상 뒤에 오는 구멍만.
  // 머리 파츠는 함께 회전하므로 구멍도 머리 안에서만 판다(몸통에 걸면 머리가 돌 때 어긋난다)
  const holesOver = (sliceName, j) =>
    holes.filter(
      (h) =>
        headSet.has(h.slice) === headSet.has(sliceName) &&
        (sliceIndex.get(h.slice) > sliceIndex.get(sliceName) ||
          (h.slice === sliceName && h.at > j)),
    );
  // 마스크 id는 인스턴스마다 다르다(같은 화면에 아바타·초상화로 두 번 그려진다) — 컴포넌트가 useId로 앞머리를 붙인다.
  // 마스크 영역은 넉넉히 잡는다 — 소비처가 viewBox를 더 넓게 덮어써도 마스크 밖이라고 잘려 나가면 안 된다.
  // 구멍 경로의 id는 뗀다 — 같은 구멍이 여러 마스크에 들어가면 id가 겹친다
  const masks = new Map();
  // 층마다 따로 그려지므로 어느 층이 어느 마스크를 쓰는지 적어 둔다 — 층 SVG에는 제 마스크만 넣는다
  const masksOfLayer = new Map();
  let currentLayer = null;
  const maskFor = (hs) => {
    const key = `holes-${hs.map((h) => h.node).join('-')}`;
    if (!masksOfLayer.has(currentLayer))
      masksOfLayer.set(currentLayer, new Set());
    masksOfLayer.get(currentLayer).add(key);
    if (!masks.has(key)) {
      const black = hs.map(
        (hole) =>
          `      ${hole.path.replace(/\s+id="[^"]*"/, '').replace(/fill="[^"]*"/, 'fill="black"')}`,
      );
      masks.set(
        key,
        `    <mask id={\`\${uid}${key}\`} maskUnits="userSpaceOnUse" x="-10000" y="-10000" width="20000" height="20000">\n      <rect x="-10000" y="-10000" width="20000" height="20000" fill="white" />\n${black.join('\n')}\n    </mask>`,
      );
    }
    return ` mask={\`url(#\${uid}${key})\`}`;
  };

  // 같은 구멍 집합에 가려지는 연속 경로를 한 <g mask>로 묶는다 — 슬라이스 그룹 자체는 그대로 둔다
  const groupOf = (sliceName, indent) => {
    const runs = [];
    buckets.get(sliceName).forEach((p, j) => {
      const hs = holesOver(sliceName, j);
      const key = hs.map((h) => h.node).join('-');
      const last = runs.at(-1);
      if (last && last.key === key) last.paths.push(p);
      else runs.push({ key, hs, paths: [p] });
    });
    const inner = runs
      .map((run) =>
        run.hs.length
          ? `${indent}  <g${maskFor(run.hs)}>\n${run.paths.map((p) => `${indent}    ${p}`).join('\n')}\n${indent}  </g>`
          : run.paths.map((p) => `${indent}  ${p}`).join('\n'),
      )
      .join('\n');
    const bake = cfg.bake?.[sliceName];
    // 구운 회전은 전역 transform-box와 충돌하므로 CSS에서 baked 클래스로 예외 처리한다
    return bake
      ? `${indent}<g id="${sliceName}">\n${indent}  <g class="baked" transform="${bake}">\n${inner}\n${indent}  </g>\n${indent}</g>`
      : `${indent}<g id="${sliceName}">\n${inner}\n${indent}</g>`;
  };

  // 층 — 움직임이 다른 덩어리마다 SVG를 따로 그려 상자째 움직인다. SVG 안쪽 그룹은 합성 레이어가 못 돼서
  // 숨쉬기·입 하나만 움직여도 매 프레임 캐릭터 전체를 다시 그리기 때문이다.
  // 머리보다 먼저 그려지는 몸은 torso, 머리는 입을 기준으로 뒤·입·앞 세 층(입 위에 볼터치·코·앞머리가 겹쳐 z순서를 지켜야 한다),
  // 머리 다음에 그려지는 조각(팔)은 제 축으로 움직이므로 저마다 한 층이다
  const mouthAt = cfg.headParts.indexOf('mouth');
  // 층은 headParts 순서로 가르고 그림은 slices 순서로 쌓는다 — 둘이 어긋나면 z순서가 소리 없이 바뀐다
  const headInSlices = cfg.slices
    .map(([sliceName]) => sliceName)
    .filter((sliceName) => cfg.headParts.includes(sliceName));
  if (headInSlices.join() !== cfg.headParts.join())
    throw new Error(`${name}: headParts 순서가 slices 순서와 다르다`);
  if (mouthAt < 0) throw new Error(`${name}: 머리 파츠에 mouth가 없다`);
  const layers = new Map();
  const pushTo = (layer, line) => {
    if (!layers.has(layer)) layers.set(layer, []);
    layers.get(layer).push(line);
  };
  let headSeen = false;
  for (const [sliceName] of cfg.slices) {
    const at = cfg.headParts.indexOf(sliceName);
    if (at >= 0) headSeen = true;
    const layer =
      at >= 0
        ? at < mouthAt
          ? 'head-back'
          : at === mouthAt
            ? 'mouth'
            : 'head-front'
        : headSeen
          ? sliceName
          : 'torso';
    currentLayer = layer;
    pushTo(layer, groupOf(sliceName, ''));
    // 표정 교체용 벡터는 CSS가 숨겨준다는 전제로 넣는다 — 스타일이 없는 곳에서 이 SVG를 쓰면
    // 눈웃음 아크가 눈 위에 그대로 그려진다. 찡그린 입은 입 앞 층으로 보낸다 — 립싱크를 타면 안 된다
    for (const extra of cfg.extras?.[sliceName] ?? [])
      pushTo(sliceName === 'mouth' ? 'head-front' : layer, extra);
  }
  const HEAD = ['head-back', 'mouth', 'head-front'];
  const limbs = [...layers.keys()].filter(
    (layer) => layer !== 'torso' && !HEAD.includes(layer),
  );
  const varOf = (key) => key.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
  // 노드 번호 사이를 밑줄로 남긴다 — 그냥 이어 붙이면 {5445, 59}와 {544, 559}가 같은 이름이 된다
  const maskVar = (key) => key.replaceAll('-', '_');
  const fragment = (lines) => `<>\n${lines.join('\n')}\n</>`;

  const decls = [
    ...[...masks].map(
      ([key, def]) => `const ${maskVar(key)} = (\n${def.trim()}\n);`,
    ),
    ...[...layers].map(
      ([layer, lines]) => `const ${varOf(layer)} = (\n${fragment(lines)}\n);`,
    ),
  ];
  const withMasks = (layer) =>
    [...(masksOfLayer.get(layer) ?? [])]
      .map((key) => `{${maskVar(key)}}`)
      .join('') + `{${varOf(layer)}}`;
  const byLayer = [...layers.keys()]
    .map((layer) => `    '${layer}': <>${withMasks(layer)}</>,`)
    .join('\n');
  // 층을 고르지 않으면 지금까지처럼 한 장으로 그린다 — 머리 래퍼(#head > #head-inner)도 그대로다
  const whole = [
    ...[...masks.keys()].map((key) => `{${maskVar(key)}}`),
    '{torso}',
    // 빈 층은 변수가 없다 — 있는 층만 잇는다(입이 머리 맨 앞이면 머리 뒤 층이 없다)
    `<g id="head">\n<g id="head-inner">\n${HEAD.filter((layer) =>
      layers.has(layer),
    )
      .map((layer) => `{${varOf(layer)}}`)
      .join('\n')}\n</g>\n</g>`,
    ...limbs.map((layer) => `{${varOf(layer)}}`),
  ].join('\n');

  const openTag = `<svg viewBox={${name.toUpperCase()}_VIEWBOX} fill="none" xmlns="http://www.w3.org/2000/svg"`;
  const limbsName = `${name.toUpperCase()}_LIMBS`;

  // 파츠를 움직여야 하므로 컴포넌트로 인라인한다. 마스크가 있으면 useId로 인스턴스마다 다른 id를 앞머리에 붙인다
  // (useId 값의 구두점은 뗀다 — url(#…) 안에서 안전하게, 고유성은 그대로다). 층마다 따로 그려도 인스턴스가 달라 id가 겹치지 않는다
  const component =
    toJsx(`import { ${masks.size ? 'useId, ' : ''}type ReactElement, type SVGProps } from 'react';

import type { PartLayer } from './part-layer';

/** 원래 그림 영역 — 층 상자의 크기와 단위 환산의 기준이다 */
export const ${name.toUpperCase()}_VIEWBOX = '${cfg.viewBox}';

/** 머리 다음에 얹히는 층 — 팔처럼 제 축으로 움직이는 조각이다 */
export const ${limbsName}: readonly PartLayer[] = [${limbs.map((l) => `'${l}'`).join(', ')}];

export const ${cfg.component} = ({
  layer,
  ...props
}: SVGProps<SVGSVGElement> & { layer?: PartLayer }) => {
${masks.size ? "  const uid = useId().replace(/[^A-Za-z0-9_-]/g, '');\n" : ''}${decls.join('\n')}
  const byLayer: Partial<Record<PartLayer, ReactElement>> = {
${byLayer}
  };

  return (
    ${openTag} {...props}>
      {layer ? byLayer[layer] : (<>
${whole}
      </>)}
    </svg>
  );
};
`);
  writeFileSync(
    new URL(
      `../src/features/conversation/ui/character/${cfg.out}`,
      import.meta.url,
    ),
    `// ${cfg.label} 캐릭터 파츠 — 생성 파일이라 직접 고치지 말고 scripts/split-character-parts.mjs를 고쳐 다시 생성한다
${component}`,
  );

  const total = [...buckets.values()].reduce((s, b) => s + b.length, 0);
  console.log(
    `${name}: ${cfg.slices.length} parts, ${total} paths -> ${cfg.out}`,
  );
}
