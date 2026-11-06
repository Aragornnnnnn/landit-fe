// 제목 강조 — 붓질·물결·두 줄·동그라미를 자리마다 다르게 써서 손으로 표시한 것처럼 보이게 한다. 화면에 들어오면 왼쪽부터 드러난다
import styles from './landing.module.css';

export type Mark = 'brush' | 'wave' | 'double' | 'circle';

const LINE = {
  fill: 'none',
  stroke: 'var(--color-primary)',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const SHAPES: Record<
  Mark,
  { viewBox: string; className: string; art: React.ReactNode }
> = {
  brush: {
    viewBox: '0 0 200 14',
    className: '-bottom-[0.14em] left-0 h-[0.26em] w-full',
    art: (
      <path
        d="M2 9C40 3 110 1 198 5c1.300 1 1.300 2-1 2.500C130 6 60 8 5 13c-4 .3-5-3-3-4Z"
        fill="var(--color-primary)"
      />
    ),
  },
  wave: {
    viewBox: '0 0 200 14',
    className: '-bottom-[0.2em] left-0 h-[0.26em] w-full',
    art: (
      <path
        {...LINE}
        strokeWidth="2.800"
        d="M2 8c10-7 18-7 28 0s18 7 28 0 18-7 28 0 18 7 28 0 18-7 28 0 18 7 28 0 18-7 28 0"
      />
    ),
  },
  double: {
    viewBox: '0 0 200 16',
    className: '-bottom-[0.22em] left-0 h-[0.3em] w-full',
    art: (
      <>
        <path {...LINE} strokeWidth="2.800" d="M3 5C60 2 140 2 197 4" />
        <path {...LINE} strokeWidth="2.800" d="M22 13c55-3 110-3 160-1" />
      </>
    ),
  },
  circle: {
    viewBox: '0 0 200 60',
    className:
      '-top-[0.2em] -left-[0.42em] h-[calc(100%+0.4em)] w-[calc(100%+0.84em)]',
    art: (
      <path
        {...LINE}
        strokeWidth="2.600"
        d="M34 9C92-1 170 2 192 22c16 18-42 34-102 33C35 54-2 42 6 24 12 10 50 4 122 6"
      />
    ),
  },
};

export const Underline = ({
  children,
  mark = 'brush',
}: {
  children: React.ReactNode;
  mark?: Mark;
}) => {
  const { viewBox, className, art } = SHAPES[mark];
  return (
    <span
      className={`relative isolate inline-block whitespace-nowrap ${mark === 'circle' ? 'mx-[0.34em]' : ''}`}
    >
      {children}
      <svg
        viewBox={viewBox}
        preserveAspectRatio="none"
        aria-hidden="true"
        className={`absolute overflow-visible ${styles.mark} ${className}`}
      >
        {art}
      </svg>
    </span>
  );
};
