// 대화 진행 규칙표 — 현재 단계에서 어떤 사건이 발생하면 다음 단계가 무엇인지 결정한다.
// useConversationTurns(유일한 사용처)가 사건을 넣고, 결정된 단계에 맞춰 실제 동작(재생·녹음·API)을 진행한다.

/** 대화가 밟는 단계 — "누가(AI/USER) 무엇을 하는 중인가"로 읽는다. */
export type ConversationPhase =
  | 'AI_SPEAKING' // AI 질문 발화 중 (글자 하이라이트)
  | 'USER_READY' // 내가 말할 준비 — 마이크 대기 (말하기 버튼)
  | 'USER_SPEAKING' // 내가 말하는 중 (답변이 실시간으로 채워진다)
  | 'AI_THINKING' // 상대가 생각하는 중 (제출 후 응답·속마음 대기 연출)
  | 'AI_INNER_THOUGHT' // 상대 속마음 노출 (랜디 슬라이드 인)
  | 'DONE'; // 모든 턴 종료

/**
 * 단계를 바꾸는 사건 — `{단계·행위}_{결말}` 꼴로 단계와 짝을 이룬다.
 * 발생원: 유저 버튼(USER_SPEAKING_*), 재생 종료(AI_SPEAKING_DONE),
 * 서버 응답(AI_RESPONSE_*), 속마음 노출 타이머(INNER_THOUGHT_DONE).
 */
export type ConversationEvent =
  | 'AI_SPEAKING_DONE'
  | 'USER_SPEAKING_STARTED'
  | 'USER_SPEAKING_CANCELLED'
  | 'USER_SPEAKING_DONE'
  | 'AI_RESPONSE_READY'
  | 'AI_RESPONSE_SKIPPED'
  | 'AI_RESPONSE_FAILED'
  | 'INNER_THOUGHT_DONE';

/** 규칙표가 기억하는 전부 — 현재 단계와 몇 번째 턴인지. 둘은 항상 함께 갱신된다. */
export interface ConversationState {
  phase: ConversationPhase;
  turnIndex: number;
}

/** 첫 화자에 따른 시작 상태 — AI가 먼저면 발화부터, 유저가 먼저면 마이크 대기부터. */
export const initialConversationState = (
  firstSpeaker: 'AI' | 'USER',
): ConversationState => ({
  phase: firstSpeaker === 'AI' ? 'AI_SPEAKING' : 'USER_READY',
  turnIndex: 0,
});

/**
 * 전이 — 현재 상태를 받아 다음 상태를 돌려준다.
 * completed: 방금 발화를 끝으로 대화가 종료되는가(서버 progress.completed).
 */
type Transition = (
  state: ConversationState,
  completed: boolean,
) => ConversationState;

/** 지정한 단계로 이동하는 단순 전이를 만든다. */
const moveTo =
  (phase: ConversationPhase): Transition =>
  (state) => ({ ...state, phase });

/**
 * AI 발화가 끝난 순간의 전이 — 방금 발화가 종료 인사였다면(completed) 대화를 끝내고,
 * 아니면 유저에게 차례를 넘긴다. 매 발화 종료마다 실행된다.
 */
const finishAiSpeaking: Transition = (state, completed) => {
  if (completed) {
    return { ...state, phase: 'DONE' };
  }
  return { ...state, phase: 'USER_READY' };
};

/** 속마음까지 끝난 순간의 전이 — 다음 발화를 재생하는 새 턴을 시작한다. */
const startNextTurn: Transition = (state) => ({
  phase: 'AI_SPEAKING',
  turnIndex: state.turnIndex + 1,
});

/**
 * 전이 표 — 각 단계가 받아들이는 사건과 그 결과.
 * 표에 없는 (단계, 사건) 조합은 무시된다 — 버튼 연타·타이머 겹침에 안전한 이유.
 */
const TRANSITIONS: Record<
  ConversationPhase,
  Partial<Record<ConversationEvent, Transition>>
> = {
  AI_SPEAKING: {
    AI_SPEAKING_DONE: finishAiSpeaking,
  },
  USER_READY: {
    USER_SPEAKING_STARTED: moveTo('USER_SPEAKING'),
  },
  USER_SPEAKING: {
    USER_SPEAKING_CANCELLED: moveTo('USER_READY'),
    USER_SPEAKING_DONE: moveTo('AI_THINKING'),
  },
  AI_THINKING: {
    AI_RESPONSE_READY: moveTo('AI_INNER_THOUGHT'),
    AI_RESPONSE_SKIPPED: startNextTurn,
    AI_RESPONSE_FAILED: moveTo('USER_READY'),
  },
  AI_INNER_THOUGHT: {
    INNER_THOUGHT_DONE: startNextTurn,
  },
  DONE: {},
};

/** 사건을 적용해 다음 상태를 돌려준다. 해당 단계가 받지 않는 사건이면 상태를 그대로 유지한다. */
export const nextConversationState = (
  state: ConversationState,
  event: ConversationEvent,
  completed = false,
): ConversationState =>
  TRANSITIONS[state.phase][event]?.(state, completed) ?? state;
