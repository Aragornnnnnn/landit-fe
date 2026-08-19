// 소셜 로그인 버튼 — 아이콘 + 라벨. 색은 각 브랜드 규정색을 className으로 주입받는다

export const LoginButton = ({
  label,
  icon,
  className,
  onClick,
  disabled,
  loading = false,
}: {
  label: string;
  icon: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  // 이 제공자로 로그인이 진행 중 — 오른쪽 끝에 스피너가 돌고 눌리지 않는다
  loading?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={`relative flex h-14 w-full items-center justify-center gap-3 rounded-xl text-base font-semibold shadow-sm transition-all active:brightness-95 disabled:pointer-events-none disabled:opacity-60 aria-busy:opacity-100 ${className ?? ''}`}
  >
    {icon}
    {label}
    {/* 브랜드 심볼·문구는 그대로 두고(카카오·구글 버튼 가이드) 오른쪽 끝에서만 진행 중임을 보인다 */}
    {loading && (
      <span className="absolute right-5 size-5 animate-spin rounded-full border-2 border-current/25 border-t-current" />
    )}
  </button>
);
