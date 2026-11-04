// AI가 채워 준다는 표시의 네 꼭짓점 반짝이 — 답변 가이드 칩과 롤플레이 아이디어 추천이 같이 쓴다
import { useId } from 'react';

// 주황(브랜드)에서 분홍·보라로 — 반짝이와 그 짝인 그라데이션 테두리가 같은 세 색을 쓴다
export const SPARKLE_COLORS = ['#f2994a', '#ec6a8c', '#8b6cf0'] as const;

// SparkleIcon과 같은 별을 그라데이션으로 칠한다
export const GradientSparkle = ({ size }: { size: number }) => {
  // useId에는 url(#…) 참조를 깨는 문자가 섞일 수 있어 걸러 낸다
  const id = `sparkle-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="flex-none"
    >
      <defs>
        <linearGradient
          id={id}
          x1="2"
          y1="2"
          x2="22"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={SPARKLE_COLORS[0]} />
          <stop offset="0.5" stopColor={SPARKLE_COLORS[1]} />
          <stop offset="1" stopColor={SPARKLE_COLORS[2]} />
        </linearGradient>
      </defs>
      <path
        d="M12 1.5q.9 9.6 10.5 10.5-9.6.9-10.5 10.5Q11.1 12.9 1.5 12q9.6-.9 10.5-10.5Z"
        fill={`url(#${id})`}
      />
    </svg>
  );
};
