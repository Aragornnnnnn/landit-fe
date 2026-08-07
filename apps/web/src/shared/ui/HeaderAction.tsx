// 앱 헤더 오른쪽 액션 한 칸 — 위에 아이콘, 아래에 라벨. 칸들이 같은 자를 쓰게 규격을 여기서 정한다
// 아이콘 줄 높이를 고정해야 라벨 줄이 맞는다. 각자 아이콘 크기대로 두면 큰 쪽만 라벨이 아래로 밀린다
import Link from 'next/link';

// 아이콘이 앉는 줄. 이 높이만 지키면 안쪽 그림이 더 커도 라벨 위치는 안 흔들린다
const ICON_ROW_HEIGHT = 22;

// 폭은 라벨이 정하되 44px 아래로는 안 내려간다 — 짧은 라벨(예: "5일")이 터치 최소 크기에 미달하던 걸 막는다.
// 전부 같은 폭으로 맞추지는 않는다. 라벨 길이가 제각각이라 그러면 짧은 칸에 빈 여백만 생겨 성기게 보인다
const ITEM_STYLE =
  'flex h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-muted-foreground transition-all active:scale-90 active:bg-secondary';

interface HeaderActionProps {
  label: string;
  children: React.ReactNode;
  // 라벨 대신 읽어 줄 문구 — 라벨이 상태에 따라 바뀌는 칸용
  ariaLabel?: string;
  // 라벨을 브랜드색으로 띄운다. 클래스를 직접 받지 않는 건 규격을 밖에서 못 덮게 하려는 것
  highlighted?: boolean;
  // 라벨이 비었다가 나중에 채워지는 칸용 — 그 사이 폭이 좁았다 넓어지며 아이콘이 옆으로 튄다.
  // 최종 라벨 폭만큼 미리 자리를 잡아 둔다
  labelMinWidth?: number;
  href?: string;
  onClick?: () => void;
}

export const HeaderAction = ({
  label,
  children,
  ariaLabel,
  highlighted = false,
  labelMinWidth,
  href,
  onClick,
}: HeaderActionProps) => {
  const content = (
    <>
      <span
        className="flex items-center justify-center"
        style={{ height: ICON_ROW_HEIGHT }}
      >
        {children}
      </span>
      <span
        // 예약 폭이 실제 라벨보다 넓을 때 글자가 왼쪽으로 쏠린다 — 가운데로 고정해야 아이콘과 축이 맞는다
        className={`text-center text-[10px] font-medium whitespace-nowrap ${
          highlighted ? 'text-primary' : ''
        }`}
        style={labelMinWidth ? { minWidth: labelMinWidth } : undefined}
      >
        {label}
      </span>
    </>
  );

  if (href) {
    // 이동하는 칸도 누른 순간을 계측할 수 있어야 해서 onClick을 함께 받는다
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-label={ariaLabel ?? label}
        className={ITEM_STYLE}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className={ITEM_STYLE}
    >
      {content}
    </button>
  );
};
