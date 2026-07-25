// 대화 상태 기계 — 한 턴(상대 발화→내 차례→내 발화→상대 생각→속마음)의 전이를 순수 함수로 관리한다
// phase는 행위자 시선으로 읽는다: "누가(AI/USER) 무엇을 하는 중인가"
// 타이머·STT·API는 여기 없다. 훅(useConversationFlow)이 이벤트만 흘려보낸다.

export type ConversationPhase =
  | 'AI_SPEAKING' // AI 질문 발화 중 (글자 하이라이트)
  | 'USER_READY' // 내가 말할 준비 — 마이크 대기 (말하기 버튼)
  | 'USER_SPEAKING' // 내가 말하는 중 (답변이 실시간으로 채워진다)
  | 'AI_THINKING' // 상대가 생각하는 중 (제출 후 응답·속마음 대기 연출)
  | 'AI_INNER_THOUGHT' // 상대 속마음 노출 (랜디 슬라이드 인)
  | 'DONE'; // 모든 턴 종료

export type ConversationEvent =
  | 'AI_SPEAKING_DONE'
  | 'USER_SPEAKING_STARTED'
  | 'USER_SPEAKING_CANCELLED'
  | 'USER_SPEAKING_DONE'
  | 'AI_RESPONSE_READY'
  | 'AI_RESPONSE_SKIPPED'
  | 'AI_RESPONSE_FAILED'
  | 'INNER_THOUGHT_DONE';

export interface ConversationState {
  phase: ConversationPhase;
  turnIndex: number;
}

export const initialConversationState = (
  firstSpeaker: 'AI' | 'USER',
): ConversationState => ({
  phase: firstSpeaker === 'AI' ? 'AI_SPEAKING' : 'USER_READY',
  turnIndex: 0,
});

// 한 턴을 마치고 다음 턴으로 — 남은 턴이 있으면 다음 AI 발화, 없으면 종료.
// 속마음을 보여준 뒤(INNER_THOUGHT_DONE)와 속마음을 건너뛴 뒤(AI_RESPONSE_SKIPPED)가 공유한다.
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
      return event === 'AI_SPEAKING_DONE'
        ? { ...state, phase: completed ? 'DONE' : 'USER_READY' }
        : state;
    case 'USER_READY':
      return event === 'USER_SPEAKING_STARTED'
        ? { ...state, phase: 'USER_SPEAKING' }
        : state;
    case 'USER_SPEAKING':
      if (event === 'USER_SPEAKING_CANCELLED')
        return { ...state, phase: 'USER_READY' };
      if (event === 'USER_SPEAKING_DONE')
        return { ...state, phase: 'AI_THINKING' };
      return state;
    case 'AI_THINKING':
      // 응답이 오면 속마음으로, 속마음이 없으면(실패·빈값) 건너뛰고 바로 다음 턴,
      // 제출이 실패하면 다시 마이크 대기로 되돌린다
      if (event === 'AI_RESPONSE_READY')
        return { ...state, phase: 'AI_INNER_THOUGHT' };
      if (event === 'AI_RESPONSE_SKIPPED') return advanceTurn(state, hasNext);
      if (event === 'AI_RESPONSE_FAILED')
        return { ...state, phase: 'USER_READY' };
      return state;
    case 'AI_INNER_THOUGHT':
      if (event !== 'INNER_THOUGHT_DONE') return state;
      return advanceTurn(state, hasNext);
    case 'DONE':
      return state;
  }
};
