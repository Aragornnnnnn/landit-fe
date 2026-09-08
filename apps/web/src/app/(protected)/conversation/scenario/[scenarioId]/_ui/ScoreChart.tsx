'use client';

// 영역별 점수 레이더 — 오각형 하나로 다섯 영역의 균형을 보여준다. 한 색 채움, 꼭짓점마다 라벨과 숫자.
// 2026-09-08 막대 후보·강점/보완 표시·후광을 다 비교해 본 뒤 기본형으로 확정했다 (강점·보완은 그래프에 안 적는다)
import { motion, useReducedMotion } from 'motion/react';

import type {
  DomainKey,
  DomainRow,
} from '@/features/feedback/model/level-assessment';
import { DURATION, EASE_STANDARD } from '@/shared/motion';

// 꼭짓점 옆에 들어가는 짧은 이름
const SHORT_LABEL: Record<DomainKey, string> = {
  situationPerformance: '상황 수행',
  grammar: '문법',
  vocabulary: '어휘',
  discourse: '대화 구성',
  interactionPragmatics: '상호 작용',
};

// 3. 레이더 — 오각형 하나로 균형을 보여준다. 한 색 채움, 꼭짓점마다 라벨과 숫자
const RADAR = 126;
// 라벨이 들어갈 바깥 여백 — 글자를 키운 만큼 넉넉히
const RADAR_LABEL = 62;
const Radar = ({ rows }: { rows: DomainRow[] }) => {
  const reduced = useReducedMotion() ?? false;
  const n = rows.length;
  const size = (RADAR + RADAR_LABEL) * 2;
  const center = size / 2;
  const point = (index: number, ratio: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / n;
    return [
      center + Math.cos(angle) * RADAR * ratio,
      center + Math.sin(angle) * RADAR * ratio,
    ] as const;
  };
  const ring = (ratio: number) =>
    rows.map((_, index) => point(index, ratio).join(',')).join(' ');
  const shape = rows
    .map((row, index) => point(index, row.score / 100).join(','))
    .join(' ');

  return (
    <div className="flex justify-center rounded-2xl border border-border bg-card py-2">
      {/* 크기는 CSS로 — 작은 폰(667pt)에서는 줄여 CTA 위에 다 들어가게 한다 */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-[340px] w-auto max-w-full short:h-[236px]"
      >
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <polygon
            key={ratio}
            points={ring(ratio)}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={1}
          />
        ))}
        {rows.map((_, index) => {
          const [x, y] = point(index, 1);
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="var(--color-border)"
              strokeWidth={1}
            />
          );
        })}

        <defs>
          {/* 채움은 주황에서 골드로 — 브랜드 두 색을 한 면에 담는다 */}
          <linearGradient id="radar-fill" x1="0" y1="0" x2="1" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-primary)"
              stopOpacity={0.55}
            />
            <stop offset="100%" stopColor="#fcd554" stopOpacity={0.35} />
          </linearGradient>
          <linearGradient id="radar-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="#f2a93b" />
          </linearGradient>
        </defs>
        {/* 점수 면 — 그라데이션 채움. 들어올 때 가운데서 펼쳐진다 */}
        <motion.polygon
          points={shape}
          fill="url(#radar-fill)"
          stroke="url(#radar-stroke)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          style={{ transformOrigin: `${center}px ${center}px` }}
          initial={reduced ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: DURATION.base * 2, ease: EASE_STANDARD }}
        />
        {rows.map((row, index) => {
          const [x, y] = point(index, row.score / 100);
          return (
            <circle
              key={row.key}
              cx={x}
              cy={y}
              r={4.5}
              fill="var(--color-primary)"
              stroke="var(--color-card)"
              strokeWidth={2}
            />
          );
        })}
        {rows.map((row, index) => {
          const [x, y] = point(index, 1.24);
          return (
            <text
              key={row.key}
              x={x}
              y={y}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={14}
              fontWeight={700}
            >
              <tspan x={x} dy="-0.2em">
                {SHORT_LABEL[row.key]}
              </tspan>
              <tspan
                x={x}
                dy="1.25em"
                fontSize={17}
                fontWeight={900}
                className="fill-foreground"
              >
                {row.score}
              </tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
};

const describe = (rows: DomainRow[]) =>
  `영역별 점수. ${rows.map((row) => `${row.label} ${row.score}점`).join(', ')}`;

export const ScoreChart = ({ rows }: { rows: DomainRow[] }) => (
  <div role="img" aria-label={describe(rows)}>
    <Radar rows={rows} />
  </div>
);
