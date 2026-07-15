// 대화 상태 기계 — 한 턴(AI 발화→마이크 대기→듣기→속마음)의 전이를 순수 함수로 관리한다
// 타이머·STT·API는 여기 없다. 훅(useConversationFlow)이 이벤트만 흘려보낸다.

export type ConversationPhase =
  | 'AI_SPEAKING' // AI 질문 발화 중 (글자 하이라이트)
  | 'USER_IDLE' // 마이크 대기 (말하기 버튼)
  | 'USER_LISTENING' // 듣는 중 (답변이 실시간으로 채워진다)
  | 'WAITING' // 답변 제출 후 상대 응답 대기 (생각 중 연출)
  | 'THOUGHT' // 상대 속마음 노출 (Sona 슬라이드 인)
  | 'DONE'; // 모든 턴 종료

export type ConversationEvent =
  | 'AI_SPEECH_END'
  | 'MIC_PRESSED'
  | 'LISTENING_CANCELLED'
  | 'LISTENING_DONE'
  | 'RESPONSE_READY'
  | 'RESPONSE_SKIPPED'
  | 'RESPONSE_FAILED'
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

// 한 턴을 마치고 다음 턴으로 — 남은 턴이 있으면 다음 AI 발화, 없으면 종료.
// 속마음을 보여준 뒤(THOUGHT_DONE)와 속마음을 건너뛴 뒤(RESPONSE_SKIPPED)가 공유한다.
const advanceTurn = (
  state: ConversationState,
  hasNext: boolean,
): ConversationState =>
  hasNext
    ? { phase: 'AI_SPEAKING', turnIndex: state.turnIndex + 1 }
    : { ...state, phase: 'DONE' };

// 단계에 맞지 않는 이벤트는 상태를 그대로 돌려준다 — 타이머와 버튼이 겹쳐 들어와도 안전하다.
// hasNext = 이어서 재생할 AI 발화가 있는가(nextMessage != null). 종료 메시지도 발화이므로 여기 포함된다.
// completed = 그 발화를 끝으로 대화가 종료되는가(서버 progress.completed). 발화 후 종료/대기를 가른다.
export const nextConversationState = (
  state: ConversationState,
  event: ConversationEvent,
  hasNext: boolean,
  completed = false,
): ConversationState => {
  switch (state.phase) {
    case 'AI_SPEAKING':
      // 발화가 끝나면 — 종료 메시지였다면 DONE(→CTA), 아니면 유저 차례로
      return event === 'AI_SPEECH_END'
        ? { ...state, phase: completed ? 'DONE' : 'USER_IDLE' }
        : state;
    case 'USER_IDLE':
      return event === 'MIC_PRESSED'
        ? { ...state, phase: 'USER_LISTENING' }
        : state;
    case 'USER_LISTENING':
      if (event === 'LISTENING_CANCELLED')
        return { ...state, phase: 'USER_IDLE' };
      if (event === 'LISTENING_DONE') return { ...state, phase: 'WAITING' };
      return state;
    case 'WAITING':
      // 응답이 오면 속마음으로, 속마음이 없으면(실패·빈값) 건너뛰고 바로 다음 턴,
      // 제출이 실패하면 다시 마이크 대기로 되돌린다
      if (event === 'RESPONSE_READY') return { ...state, phase: 'THOUGHT' };
      if (event === 'RESPONSE_SKIPPED') return advanceTurn(state, hasNext);
      if (event === 'RESPONSE_FAILED') return { ...state, phase: 'USER_IDLE' };
      return state;
    case 'THOUGHT':
      if (event !== 'THOUGHT_DONE') return state;
      return advanceTurn(state, hasNext);
    case 'DONE':
      return state;
  }
};
