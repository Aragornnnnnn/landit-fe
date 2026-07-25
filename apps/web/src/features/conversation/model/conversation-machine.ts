// 대화 상태 기계 — 한 턴(상대 발화→내 차례→내 발화→상대 생각→속마음)의 전이를 순수 함수로 관리한다

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

// ── 2. 첫 상태 — 첫 화자에 따라 AI 발화 또는 내 차례에서 시작한다 ──
export const initialConversationState = (
  firstSpeaker: 'AI' | 'USER',
): ConversationState => ({
  phase: firstSpeaker === 'AI' ? 'AI_SPEAKING' : 'USER_READY',
  turnIndex: 0,
});

// ── 3. 상태가 바뀌는 규칙 — "어떤 단계에서 어떤 사건이 오면 어디로 가나" ──
// hasNext: 이어서 재생할 AI 발화가 있는가(종료 메시지 포함).
// completed: 그 발화를 끝으로 대화가 종료되는가(서버 progress.completed).
interface TransitionContext {
  hasNext: boolean;
  completed: boolean;
}

type Transition = (
  state: ConversationState,
  context: TransitionContext,
) => ConversationState;

// 대화를 끝낸다 — 어느 경로로 끝나든 도착지는 하나다
const endConversation = (state: ConversationState): ConversationState => ({
  ...state,
  phase: 'DONE',
});

// 그 phase로 이동하는 단순 전이
const moveTo =
  (phase: ConversationPhase): Transition =>
  (state) => ({ ...state, phase });

// AI 발화가 끝난 순간 — 방금 발화가 종료 인사였다면 대화를 끝내고, 아니면 유저에게 차례를 넘긴다
const finishAiSpeaking: Transition = (state, { completed }) => {
  if (completed) {
    return endConversation(state);
  }
  return { ...state, phase: 'USER_READY' };
};

// 속마음까지 끝난 순간 — 틀어줄 다음 발화가 있으면 새 턴을 시작하고, 없으면 대화를 끝낸다.
// 정상 종료는 서버가 종료 인사를 보내줘서 여기선 새 턴 → 재생 후 finishAiSpeaking에서 DONE이 되고,
// 여기서 바로 끝나는 건 서버가 발화 없이 끝내는 경우다 (계약상 nextMessage: null 허용 — session.ts)
const finishTurn: Transition = (state, { hasNext }) => {
  if (hasNext) {
    return { phase: 'AI_SPEAKING', turnIndex: state.turnIndex + 1 };
  }
  return endConversation(state);
};

// 전이 표 — 각 phase가 받아들이는 이벤트와 그 결과를 한눈에 적는다.
// 표에 없는 (phase, 이벤트) 조합은 무시된다(연타·타이머 겹침 방어). DONE은 아무것도 받지 않는다.
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
    AI_RESPONSE_SKIPPED: finishTurn,
    AI_RESPONSE_FAILED: moveTo('USER_READY'),
  },
  AI_INNER_THOUGHT: {
    INNER_THOUGHT_DONE: finishTurn,
  },
  DONE: {},
};

// ── 4. 입구 — 바깥(훅)이 부르는 유일한 함수. 표에서 규칙을 찾아 적용하고, 없으면 무시한다 ──

export const nextConversationState = (
  state: ConversationState,
  event: ConversationEvent,
  hasNext: boolean,
  completed = false,
): ConversationState =>
  TRANSITIONS[state.phase][event]?.(state, { hasNext, completed }) ?? state;
