// 카드가 놓이는 자리 — 바깥 여백과 바닥 그림자. 스켈레톤과 실제 카드가 같은 자리를 써야 바뀌는 순간 튀지 않는다
export const CardStage = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-0 flex-1 items-center justify-center px-6 pt-2 pb-4">
    <div className="relative h-full w-full">{children}</div>
  </div>
);

// 카드 아래 바닥 그림자의 자리·모양 — 정지한 그림자와 램프 도착 연출의 그림자가 같이 쓴다
export const CARD_SHADOW_CLASS =
  'absolute -bottom-1 left-1/2 h-5 w-3/5 -translate-x-1/2 rounded-[50%] bg-foreground blur-md';

// 카드 아래 바닥 그림자 — 떠 있는 카드를 바닥에 붙여 준다
export const CardShadow = () => (
  <div aria-hidden className={`${CARD_SHADOW_CLASS} opacity-20`} />
);
