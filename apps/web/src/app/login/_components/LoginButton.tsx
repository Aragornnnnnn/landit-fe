// 소셜 로그인 버튼 — 아이콘 + 라벨. 색은 각 브랜드 규정색을 className으로 주입받는다

export const LoginButton = ({
  label,
  icon,
  className,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex h-14 w-full items-center justify-center gap-3 rounded-xl text-base font-semibold shadow-sm transition-all active:brightness-95 disabled:pointer-events-none disabled:opacity-60 ${className ?? ''}`}
  >
    {icon}
    {label}
  </button>
);
