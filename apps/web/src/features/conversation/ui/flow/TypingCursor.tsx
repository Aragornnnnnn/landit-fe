// 깜빡이 커서 — 질문 카드는 타이핑 진행을, 내 답변 칸은 고칠 수 있는 입력된 글임을 알린다
// ref는 지금 타이핑되는 자리를 따라가야 하는 쪽(질문 카드 스크롤)에서만 쓴다
export const TypingCursor = ({ ref }: { ref?: React.Ref<HTMLSpanElement> }) => (
  <span ref={ref} className="ml-0.5 inline-block animate-pulse text-primary">
    |
  </span>
);
