// 튜토리얼 문장 타이핑 규칙 — 한 자씩 쓰고 기다렸다가, 다 쓴 뒤에 누르면 지우고 다음 문장을 쓴다. 시계는 화면이 돌린다
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

/** 쓰는 중인 문장을 끝까지 한 번에 보여 준다 — 동작 줄이기 설정일 때 쓴다 */
export const revealTyping = (
  state: TypingState,
  lengths: readonly number[],
): TypingState => ({ ...state, count: lengths[state.index], phase: 'shown' });

/** 화면을 눌렀다 — 다 쓴 문장이면 지우기 시작한다. 쓰는 중엔 무시해 연타로 문장을 건너뛰지 못한다 */
export const tapTyping = (
  state: TypingState,
  lengths: readonly number[],
): TypingState => {
  const last = state.index === lengths.length - 1;
  if (state.phase === 'shown' && !last) return { ...state, phase: 'erasing' };
  return state;
};
