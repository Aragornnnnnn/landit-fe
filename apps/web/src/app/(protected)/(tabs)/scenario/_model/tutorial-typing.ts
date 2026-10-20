// 튜토리얼 문장 타이핑 규칙 — 한 자씩 쓰고 기다렸다가, 누르면 지우고 다음 문장을 쓴다. 시계는 화면이 돌린다
export interface TypingState {
  // 지금 문장
  index: number;
  // 보이는 글자 수
  count: number;
  phase: 'typing' | 'shown' | 'erasing';
}

export const INITIAL_TYPING: TypingState = {
  index: 0,
  count: 0,
  phase: 'typing',
};

/** 시계 한 번 — 쓰는 중이면 한 자 늘고, 지우는 중이면 한 자 준다 */
export const tickTyping = (
  state: TypingState,
  lengths: readonly number[],
): TypingState => {
  const length = lengths[state.index];
  if (state.phase === 'typing') {
    const count = state.count + 1;
    return { ...state, count, phase: count >= length ? 'shown' : 'typing' };
  }
  if (state.phase === 'erasing') {
    if (state.count > 1) return { ...state, count: state.count - 1 };
    return { index: state.index + 1, count: 0, phase: 'typing' };
  }
  return state;
};

/** 화면을 눌렀다 — 쓰는 중이면 끝까지 보여 주고, 다 쓴 문장이면 지우기 시작한다 */
export const tapTyping = (
  state: TypingState,
  lengths: readonly number[],
): TypingState => {
  if (state.phase === 'typing') {
    return { ...state, count: lengths[state.index], phase: 'shown' };
  }
  const last = state.index === lengths.length - 1;
  if (state.phase === 'shown' && !last) return { ...state, phase: 'erasing' };
  return state;
};
