// 타이핑 진행을 알리는 깜빡이 커서 — 질문 카드·내 답변·표현 준비 화면이 공유한다
// ref는 지금 타이핑되는 자리를 따라가야 하는 쪽(질문 카드 스크롤)에서만 쓴다
export const TypingCursor = ({ ref }: { ref?: React.Ref<HTMLSpanElement> }) => (
  <span ref={ref} className="ml-0.5 inline-block animate-pulse text-primary">
    |
  </span>
);
