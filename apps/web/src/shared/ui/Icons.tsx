// 공통 인라인 아이콘 — lucide-react와 동일한 path, 아이콘 몇 개 때문에 의존성을 늘리지 않는다

interface IconProps extends React.ComponentProps<'svg'> {
  size?: number;
}

export const ChevronLeftIcon = ({ size = 22, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const ChevronRightIcon = ({ size = 22, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);
