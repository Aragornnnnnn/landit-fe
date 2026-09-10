// 스토어 브랜드 아이콘 — 구독 관리처럼 스토어로 보내는 자리에서 어디로 가는지 보여준다. 각 사 규정 색을 그대로 쓴다 (토큰화 대상 아님)

interface StoreIconProps {
  size?: number;
}

/** App Store — 파란 둥근 사각형 위 흰 "A" 모양 */
export const AppStoreIcon = ({ size = 22 }: StoreIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <linearGradient
        id="app-store-bg"
        x1="12"
        y1="0"
        x2="12"
        y2="24"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#1FB2FF" />
        <stop offset="1" stopColor="#1268FF" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="5.5" fill="url(#app-store-bg)" />
    <path
      d="M12.85 5.6l.8-1.4a.5.5 0 0 1 .87.5l-.8 1.4 3.7 6.4h2.03a.55.55 0 0 1 0 1.1h-1.4l1.1 1.9a.5.5 0 0 1-.87.5l-1.1-1.9-.4-.7-3.9-6.75.07-.13-1.5-2.6a.5.5 0 0 1 .87-.5l.53.92zM11.9 7.35l3.36 5.85H6.55a.55.55 0 0 1 0-1.1h1.99l2.66-4.6.7 1.2zM8.3 15.1h1.27l-1.13 1.95a.5.5 0 0 1-.87-.5l.73-1.45z"
      fill="#fff"
    />
  </svg>
);

/** Google Play — 네 가지 색 삼각형 */
export const GooglePlayIcon = ({ size = 22 }: StoreIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3.6 2.6c-.37.4-.6 1-.6 1.78v15.24c0 .78.23 1.38.6 1.78l.1.09L12.3 12.9v-.2L3.7 2.5l-.1.1z"
      fill="#00A0FF"
    />
    <path
      d="M15.2 15.8l-2.9-2.9v-.2l2.9-2.9.07.04 3.44 1.96c.98.56.98 1.47 0 2.03l-3.44 1.96-.07-.01z"
      fill="#FFD500"
    />
    <path
      d="M15.27 15.76L12.3 12.8 3.6 21.4c.32.34.85.38 1.45.04l10.22-5.68z"
      fill="#FF3A44"
    />
    <path
      d="M15.27 9.84L5.05 4.16c-.6-.34-1.13-.3-1.45.04l8.7 8.6 2.97-2.96z"
      fill="#32A071"
    />
  </svg>
);
