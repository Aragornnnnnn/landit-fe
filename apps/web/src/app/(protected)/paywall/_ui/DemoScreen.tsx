// 카드 속 폰 데모의 공통 틀 — 390×844로 그린 앱 화면을 폰 폭에 맞게 통째로 줄인다.
// 화면 전체가 한눈에 들어오게 확대·이동은 하지 않는다 (작은 폰 안에서 화면이 움직이면 모바일에서 읽히지 않았다)
const SCREEN_WIDTH = 390;

interface DemoScreenProps {
  /** 폰 화면의 실제 폭(px) */
  width: number;
  children: React.ReactNode;
}

export const DemoScreen = ({ width, children }: DemoScreenProps) => (
  <div
    aria-hidden="true"
    className="absolute top-0 left-0 h-[844px] w-[390px] origin-top-left overflow-hidden bg-background contain-strict"
    style={{ transform: `scale(${width / SCREEN_WIDTH})` }}
  >
    {children}
  </div>
);

/**
 * 데모 속 화면 한 장 — 장면이 바뀌면 서로 겹쳐 사르르 바뀐다.
 * 카드 속 작은 폰은 위쪽 540px쯤만 보이니, 화면마다 그 안에 다 들어가게 짠다
 */
export const DemoSlide = ({
  shown,
  children,
}: {
  shown: boolean;
  children: React.ReactNode;
}) => (
  <div
    className={`absolute inset-0 bg-background transition-opacity duration-500 ${shown ? 'opacity-100' : 'opacity-0'}`}
  >
    {children}
  </div>
);

/** 데모가 받는 것 — 지금 장면 번호와 몇 번째 바퀴인지, 폰 화면 폭. 시계는 카드가 돌린다 */
export interface DemoProps {
  step: number;
  loop?: number;
  width: number;
}
