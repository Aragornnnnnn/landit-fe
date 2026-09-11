'use client';

// 영역별 점수 레이더 — 오각형 하나로 다섯 영역의 균형을 보여준다. 한 색 채움, 꼭짓점마다 짧은 라벨과 숫자.
// 2026-09-08 막대 후보·강점/보완 표시·후광을 다 비교해 본 뒤 기본형으로 확정했다 (강점·보완은 그래프에 안 적는다)
import { motion, useReducedMotion } from 'motion/react';

import type { DomainRow } from '@/features/feedback/model/level-assessment';
import { DURATION, EASE_STANDARD } from '@/shared/motion';

const RADAR_RADIUS = 126;
// 라벨이 들어갈 바깥 여백 — 글자를 키운 만큼 넉넉히
const LABEL_MARGIN = 62;
// 라벨은 꼭짓점보다 조금 밖에 — 1을 넘기는 유일한 비율이라 잘리지 않을 만큼만
const LABEL_RADIUS_RATIO = 1.24;
const GRID_RINGS = [0.25, 0.5, 0.75, 1];

const toScoreDescription = (rows: DomainRow[]) =>
  `영역별 점수. ${rows.map((row) => `${row.label} ${row.score}점`).join(', ')}`;

// 꼭짓점이 셋보다 적으면 도형이 안 된다 — 점수를 줄로 적는다. 하나도 없으면 아무것도 그리지 않는다
const ScoreList = ({ rows }: { rows: DomainRow[] }) =>
  rows.length === 0 ? null : (
    <ul
      aria-label={toScoreDescription(rows)}
      className="rounded-2xl border border-border bg-card px-5 py-2"
    >
      {rows.map((row) => (
        <li
          key={row.key}
          className="flex items-center justify-between py-2.5 text-[15px]"
        >
          <span className="text-muted-foreground">{row.label}</span>
          <span className="text-[17px] font-black">{row.score}</span>
        </li>
      ))}
    </ul>
  );

/** 관찰된 영역만 꼭짓점으로 그린다 — 다섯 개가 아니어도 도형은 닫힌다. 셋보다 적으면 목록으로 대신한다 */
export const ScoreChart = ({ rows }: { rows: DomainRow[] }) => {
  const reduced = useReducedMotion() ?? false;
  if (rows.length < 3) return <ScoreList rows={rows} />;
  const vertexCount = rows.length;
  const size = (RADAR_RADIUS + LABEL_MARGIN) * 2;
  const center = size / 2;
  const pointAt = (index: number, ratio: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / vertexCount;
    return [
      center + Math.cos(angle) * RADAR_RADIUS * ratio,
      center + Math.sin(angle) * RADAR_RADIUS * ratio,
    ] as const;
  };
  const ringAt = (ratio: number) =>
    rows.map((_, index) => pointAt(index, ratio).join(',')).join(' ');
  const scoreShape = rows
    .map((row, index) => pointAt(index, row.score / 100).join(','))
    .join(' ');

  return (
    <div
      role="img"
      aria-label={toScoreDescription(rows)}
      className="flex h-full max-h-[358px] justify-center rounded-2xl border border-border bg-card py-2"
    >
      {/* 크기는 부모 높이를 따른다 — 큰 폰은 340px(카드 358 = 340 + 안여백 16 + 테두리 2)에서 멈추고, 작은 폰은 CTA 위 남은 높이만큼 줄어든다 */}
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-auto max-w-full">
        {GRID_RINGS.map((ratio) => (
          <polygon
            key={ratio}
            points={ringAt(ratio)}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={1}
          />
        ))}
        {rows.map((row, index) => {
          const [x, y] = pointAt(index, 1);
          return (
            <line
              key={row.key}
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
        {/* 점수 면 — 들어올 때 가운데서 펼쳐진다 */}
        <motion.polygon
          points={scoreShape}
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
          const [x, y] = pointAt(index, row.score / 100);
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
          const [x, y] = pointAt(index, LABEL_RADIUS_RATIO);
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
                {row.shortLabel}
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
