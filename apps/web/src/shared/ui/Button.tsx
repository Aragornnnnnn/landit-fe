// 앱 전체에서 사용하는 3D 버튼

type Variant =
  'primary' | 'white' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'lg' | 'md' | 'sm';

interface ButtonProps extends React.ComponentProps<'button'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const baseClasses =
  'flex w-full items-center justify-center gap-2 ' +
  'shadow-[0_var(--lift)_0_var(--edge)] transition-[translate,box-shadow] duration-75 ' +
  'active:translate-y-(--lift) active:shadow-none';

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground [--edge:color-mix(in_srgb,var(--primary)_75%,black)]',
  white:
    'bg-linear-to-b from-card to-muted text-primary [--edge:color-mix(in_srgb,var(--card)_45%,transparent)]',
  secondary: 'bg-secondary text-secondary-foreground [--edge:var(--border)]',
  ghost: 'border border-border bg-card text-foreground [--edge:var(--border)]',
  danger:
    'bg-destructive text-destructive-foreground [--edge:color-mix(in_srgb,var(--destructive)_70%,black)]',
  success:
    'bg-success text-success-foreground [--edge:color-mix(in_srgb,var(--success)_72%,black)]',
};

const sizeClasses: Record<Size, string> = {
  lg: 'h-14 rounded-xl text-base font-bold [--lift:5px]',
  md: 'h-12 rounded-lg text-sm font-semibold [--lift:4px]',
  sm: 'h-10 rounded-lg text-sm font-semibold [--lift:3px]',
};

const stateClasses = (loading: boolean, disabled?: boolean) => {
  if (loading) {
    return 'translate-y-(--lift) cursor-wait opacity-45 shadow-none';
  }
  if (disabled) {
    return 'translate-y-0! cursor-not-allowed opacity-45 shadow-none!';
  }
  return '';
};

export const Button = ({
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) => {
  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${stateClasses(loading, disabled)} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
      )}
      {children}
    </button>
  );
};
