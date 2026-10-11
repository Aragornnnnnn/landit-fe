// 금색 입체 글씨 — 프리미엄 금색(GOLD_GRADIENT #e0a63a→#f7cf5c)을 두께 있는 글씨로. 뒤 층에 테두리와 두께를 겹겹이 쌓고(앞 겹은 호박색, 깊을수록 밤색), 앞 층은 위가 밝고 아래가 진한 그라데이션에 왼쪽 위로 얇은 빛을 건다.
// 앞 층이 글자를 투명하게 비워 그라데이션을 보이므로 두께(text-shadow)는 따로 뒤 층에 둔다 — 한 층에 같이 두면 그림자가 글자 속으로 비친다.
// 앞 층엔 테두리(text-stroke)를 쓰지 않는다 — 한글 글꼴은 획이 겹쳐 그려져, 속이 빈 글자에 테두리를 두르면 겹친 획 선이 글자 안에 보인다
import type { CSSProperties } from 'react';

const FACE =
  'linear-gradient(180deg,#fff4cf 0%,#f7cf5c 40%,#e0a63a 78%,#c8871f 100%)';
const EDGE = 'rgba(255,248,225,0.95)';
const OUTLINE = '#a8701a';
/** 두께의 앞·뒤 색(rgb) */
const NEAR = [176, 118, 30];
const FAR = [70, 42, 0];

/** 두께 — 1px씩 8겹. 앞 겹은 NEAR, 뒤로 갈수록 FAR 색에 가까워지고, 마지막에 바닥 그림자 */
const DEPTH = 8;
const EXTRUDE = [
  ...Array.from({ length: DEPTH }, (_, index) => {
    const ratio = index / (DEPTH - 1);
    const [r, g, b] = NEAR.map((value, channel) =>
      Math.round(value + (FAR[channel] - value) * ratio),
    );
    return `${index + 1}px ${index + 1}px 0 rgb(${r},${g},${b})`;
  }),
  `${DEPTH + 3}px ${DEPTH + 6}px 14px rgba(0,0,0,0.3)`,
].join(', ');

export const Text3D = ({ children }: { children: React.ReactNode }) => (
  <span className="relative inline-block">
    <span
      aria-hidden="true"
      className="absolute inset-0"
      style={
        {
          color: OUTLINE,
          WebkitTextStroke: `3px ${OUTLINE}`,
          textShadow: EXTRUDE,
        } as CSSProperties
      }
    >
      {children}
    </span>
    <span
      className="relative bg-clip-text text-transparent"
      style={{
        backgroundImage: FACE,
        filter: `drop-shadow(-1px -1px 0 ${EDGE})`,
      }}
    >
      {children}
    </span>
  </span>
);
