// 작성 화면 하단의 보내기 바 — 화면 끝까지 꽉 차는 납작한 바 (피그마 5-2c 스펙)
// 앱의 공용 Button(여백 + 둥근 3D)과 다른 모양이라 이 화면 안에 둔다.
// 키보드 위에 붙어 서는 자리라 좌우 여백과 그림자가 오히려 방해가 된다

// 시안 높이. 홈 인디케이터 영역은 아래 여백으로 더해 색이 화면 끝까지 이어지게 한다
const BAR_HEIGHT = 53;

interface SubmitBarProps {
  disabled: boolean;
  loading: boolean;
  // 키보드가 올라와 있으면 바가 이미 키보드 위에 붙어 홈 인디케이터를 덮을 일이 없다
  keyboardOpen: boolean;
  onClick: () => void;
}

export const SubmitBar = ({
  disabled,
  loading,
  keyboardOpen,
  onClick,
}: SubmitBarProps) => (
  <button
    type="button"
    disabled={disabled || loading}
    onClick={onClick}
    style={{
      height: BAR_HEIGHT,
      paddingBottom: keyboardOpen ? 0 : 'env(safe-area-inset-bottom)',
    }}
    className={`box-content w-full shrink-0 text-[15px] font-bold transition-colors ${
      disabled
        ? 'bg-secondary text-muted-foreground'
        : 'bg-primary text-primary-foreground'
    } ${loading ? 'opacity-60' : ''}`}
  >
    보내기
  </button>
);
