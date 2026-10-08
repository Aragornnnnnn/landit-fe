// 카드 속 폰 — 검은 테두리 안에 코드로 그린 화면을 담는다
interface PhoneFrameProps {
  className?: string;
  style?: React.CSSProperties;
  /** 화면 모서리 반경(px). 테두리는 여기에 1.5px을 더한다 */
  radius?: number;
  children: React.ReactNode;
}

export const PhoneFrame = ({
  className = '',
  style,
  radius = 18.5,
  children,
}: PhoneFrameProps) => (
  <div
    className={`bg-[#1b1c1e] p-[1.5px] shadow-[0_8px_11px_rgba(0,0,0,0.14)] ${className}`}
    style={{ borderRadius: radius + 1.5, ...style }}
  >
    <div
      className="relative size-full overflow-hidden bg-background"
      style={{ borderRadius: radius }}
    >
      {children}
    </div>
  </div>
);
