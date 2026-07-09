// 소셜 로그인 버튼 — 아이콘 + 라벨. 색은 각 브랜드 규정색을 className으로 주입받는다

export const LoginButton = ({
  label,
  icon,
  className,
}: {
  label: string;
  icon: React.ReactNode;
  className?: string;
}) => (
  <button
    className={`flex h-14 w-full items-center justify-center gap-3 rounded-xl text-base font-semibold shadow-sm transition-all active:brightness-95 ${className ?? ''}`}
  >
    {icon}
    {label}
  </button>
);
