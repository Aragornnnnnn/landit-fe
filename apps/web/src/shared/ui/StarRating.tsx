// 별점 표시 — 3성 만점, 반 개 단위. 채워진 별은 골드, 빈 별은 연회색. 둘 다 테두리 없는 솔리드
'use client';

import { motion } from 'motion/react';

interface StarRatingProps {
  rating: number;
  size?: number;
  className?: string;
  // 켜면 별이 하나씩 톡톡 튀어나온다 (피드백 총평 연출용, 기본 정적)
  animate?: boolean;
}

export const StarRating = ({
  rating,
  size = 14,
  className = '',
  animate = false,
}: StarRatingProps) => (
  <span className={`flex items-center gap-0.5 ${className}`}>
    {[0, 1, 2].map((slot) => {
      // 이 칸의 채움 정도 — 1(가득), 0.5(반), 0(빈)
      const fill = Math.min(Math.max(rating - slot, 0), 1);

      const star = (
        <>
          <Star size={size} />
          {fill > 0 && (
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: fill >= 1 ? '100%' : '50%' }}
            >
              <Star size={size} filled />
            </span>
          )}
        </>
      );

      if (!animate) {
        return (
          <span key={slot} className="relative">
            {star}
          </span>
        );
      }

      return (
        <motion.span
          key={slot}
          className="relative inline-flex"
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.15 + slot * 0.13,
            type: 'spring',
            stiffness: 620,
            damping: 12,
          }}
        >
          {star}
        </motion.span>
      );
    })}
  </span>
);

const Star = ({ size, filled }: { size: number; filled?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'var(--star-filled)' : 'var(--star-empty)'}
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
