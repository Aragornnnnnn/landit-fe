// 대화 상태 기계 — 한 턴(AI 발화→마이크 대기→듣기→속마음)의 전이를 순수 함수로 관리한다
// 타이머·STT·API는 여기 없다. 훅(useConversationFlow)이 이벤트만 흘려보낸다.

export type ConversationPhase =
  | 'AI_SPEAKING' // AI 질문 발화 중 (글자 하이라이트)
  | 'USER_IDLE' // 마이크 대기 (말하기 버튼)
  | 'USER_LISTENING' // 듣는 중 (답변이 실시간으로 채워진다)
  | 'THOUGHT' // 상대 속마음 노출 (Sona 슬라이드 인)
  | 'DONE'; // 모든 턴 종료

export type ConversationEvent =
  | 'AI_SPEECH_END'
  | 'MIC_PRESSED'
  | 'LISTENING_CANCELLED'
  | 'LISTENING_DONE'
  | 'THOUGHT_DONE';

export interface ConversationState {
  phase: ConversationPhase;
  turnIndex: number;
}

export const initialConversationState = (
  firstSpeaker: 'AI' | 'USER',
): ConversationState => ({
  phase: firstSpeaker === 'AI' ? 'AI_SPEAKING' : 'USER_IDLE',
  turnIndex: 0,
});

// 단계에 맞지 않는 이벤트는 상태를 그대로 돌려준다 — 타이머와 버튼이 겹쳐 들어와도 안전하다
// hasNext = 다음 턴이 남아있는가(서버 progress.completed의 반대). 종료 판정에만 쓴다.
export const nextConversationState = (
  state: ConversationState,
  event: ConversationEvent,
  hasNext: boolean,
): ConversationState => {
  switch (state.phase) {
    case 'AI_SPEAKING':
      return event === 'AI_SPEECH_END'
        ? { ...state, phase: 'USER_IDLE' }
        : state;
    case 'USER_IDLE':
      return event === 'MIC_PRESSED'
        ? { ...state, phase: 'USER_LISTENING' }
        : state;
    case 'USER_LISTENING':
      if (event === 'LISTENING_CANCELLED')
        return { ...state, phase: 'USER_IDLE' };
      if (event === 'LISTENING_DONE') return { ...state, phase: 'THOUGHT' };
      return state;
    case 'THOUGHT':
      if (event !== 'THOUGHT_DONE') return state;
      return hasNext
        ? { phase: 'AI_SPEAKING', turnIndex: state.turnIndex + 1 }
        : { ...state, phase: 'DONE' };
    case 'DONE':
      return state;
  }
};
