// 별점 표시 — 3성 만점, 반 개 단위. 채워진 별은 골드, 빈 별은 연회색 아웃라인
interface StarRatingProps {
  rating: number;
  size?: number;
  className?: string;
}

export const StarRating = ({
  rating,
  size = 14,
  className = '',
}: StarRatingProps) => (
  <span className={`flex items-center gap-0.5 ${className}`}>
    {[0, 1, 2].map((slot) => {
      // 이 칸의 채움 정도 — 1(가득), 0.5(반), 0(빈)
      const fill = Math.min(Math.max(rating - slot, 0), 1);

      return (
        <span key={slot} className="relative">
          <Star size={size} />
          {fill > 0 && (
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: fill >= 1 ? '100%' : '50%' }}
            >
              <Star size={size} filled />
            </span>
          )}
        </span>
      );
    })}
  </span>
);

const Star = ({ size, filled }: { size: number; filled?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'var(--star-filled)' : 'none'}
    stroke={filled ? 'none' : 'var(--star-empty)'}
    strokeWidth={filled ? 0 : 2}
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
