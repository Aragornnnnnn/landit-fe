// 앱 헤더 오른쪽 액션 한 칸 — 아이콘 하나. 칸들이 같은 자를 쓰게 규격을 여기서 정한다
//
// 글자 라벨은 두지 않는다. 칸이 셋으로 늘면서 라벨까지 얹으면 헤더 폭이 빡빡하고,
// 셋 다 뜻이 아이콘만으로 통한다. 대신 이름은 aria-label로 반드시 읽어 준다
import Link from 'next/link';

// 44px — 아이콘이 제각각이어도 터치 영역은 같아야 한다
const ITEM_STYLE =
  'flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-all active:scale-90 active:bg-secondary';

interface HeaderActionProps {
  // 이 칸을 뭐라고 부르는지. 눈에는 안 보이고 보조 기술이 읽는다
  label: string;
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export const HeaderAction = ({
  label,
  children,
  href,
  onClick,
}: HeaderActionProps) => {
  if (href) {
    // 이동하는 칸도 누른 순간을 계측할 수 있어야 해서 onClick을 함께 받는다
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-label={label}
        className={ITEM_STYLE}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={ITEM_STYLE}
    >
      {children}
    </button>
  );
};
