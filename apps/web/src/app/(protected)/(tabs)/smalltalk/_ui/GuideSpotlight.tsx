// 첫 안내가 비추는 자리 — 감싼 것을 어둠 위로 올려 금색 테두리를 두르고, 그 위에 꼬리가 닿는 말풍선을 붙인다.
// 표현 프리뷰의 카드 스포트라이트와 같은 말풍선·테두리다. 꺼져 있으면 감싼 것을 그대로 둔다
// 비춘 자리 위의 말풍선 — 꼬리가 아래로 자리에 닿는다
const GuideBubble = ({ children }: { children: React.ReactNode }) => (
  <p className="pointer-events-none absolute bottom-full left-1/2 z-[60] mb-5 w-max max-w-[300px] -translate-x-1/2 rounded-2xl bg-card px-5 py-3.5 text-center text-base leading-snug font-bold break-keep text-foreground shadow-lg">
    <span
      aria-hidden
      className="absolute -bottom-1.5 left-1/2 size-3.5 -translate-x-1/2 rotate-45 rounded-[3px] bg-card"
    />
    {children}
  </p>
);

export const GuideSpotlight = ({
  active,
  message,
  rounded,
  className = '',
  children,
}: {
  active: boolean;
  message: React.ReactNode;
  // 테두리 모서리 — 감싼 것의 모양을 따른다
  rounded: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <div
    className={`${className} ${
      active
        ? `relative z-[60] outline-3 outline-offset-[6px] outline-[#ffd25e] ${rounded}`
        : ''
    }`}
  >
    {active && <GuideBubble>{message}</GuideBubble>}
    {children}
  </div>
);
