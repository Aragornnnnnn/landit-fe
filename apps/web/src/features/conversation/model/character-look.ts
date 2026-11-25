// 대화 진행 단계와 속마음을 캐릭터의 겉모습으로 옮기는 규칙.
// 자세와 표정은 서로 독립이라 축을 나눠 둔다 — 하나로 합치면 표정이 뜨는 동안 자세가 사라져서,
// 웃는 얼굴로 말할 때 입이 멈추고 찡그린 얼굴로 말할 때 립싱크가 가려진다.
import type { ConversationPhase } from './conversation-machine';
import type { FloatingThought, ThoughtType } from './thought';

/** 대화 상대가 누구인가 — 서버 conversation_character의 character_id와 같은 문자열이다 */
export type Partner = 'marco' | 'chloe' | 'teddy';

/** 몸이 무엇을 하는 중인가 */
export type CharacterPosture = 'idle' | 'listening' | 'speaking';

/** 얼굴이 무엇을 말하는가. neutral은 표정을 얹지 않는다는 뜻이다 — 이름은 표정 데이터(expressions/*.json)의 표정 키와 같다 */
export type CharacterExpression =
  'neutral' | 'happy' | 'frown' | 'angry' | 'sad' | 'love' | 'sulky' | 'shy';

export interface CharacterLook {
  posture: CharacterPosture;
  expression: CharacterExpression;
}

/**
 * 단계마다 취할 자세. Record로 둬서 단계가 추가되면 타입 검사가 빠진 자리를 잡아준다.
 *
 * USER_READY가 idle인 이유 — 아직 한 마디도 안 들었으니 끄덕이지 않는다.
 * 침묵에 맞장구치는 꼴이고 재촉으로도 읽힌다. 끄덕임은 listening에서만 돌기 때문에
 * 기본 자세로 두는 것만으로 멈춘다.
 *
 * AI_THINKING이 idle인 이유 — 이미 다 들은 뒤라 맞장구칠 것이 없다.
 * 표정은 속마음이 말풍선에 뜰 때 따로 얹힌다.
 *
 * 그래서 끄덕임은 유저가 실제로 말하는 동안에만 돈다.
 */
const BY_PHASE: Record<ConversationPhase, CharacterPosture> = {
  AI_SPEAKING: 'speaking',
  USER_READY: 'idle',
  USER_SPEAKING: 'listening',
  AI_THINKING: 'idle',
  DONE: 'idle',
};

/** 중립은 표정을 만들지 않고 하던 대로 이어간다 — 굳이 멈춰 세울 반응이 아니다 */
const BY_THOUGHT: Record<ThoughtType, CharacterExpression> = {
  GOOD: 'happy',
  NORMAL: 'neutral',
  BAD: 'frown',
};

export const toThoughtExpression = (type: ThoughtType): CharacterExpression =>
  BY_THOUGHT[type];

/** 서버가 판별한 속마음 감정 → 표정. 감정 이름은 서버 계약(ThoughtEmotion) 그대로다 */
const BY_EMOTION: Record<string, CharacterExpression> = {
  NEUTRAL: 'neutral',
  HAPPY: 'happy',
  FROWN: 'frown',
  ANGRY: 'angry',
  SAD: 'sad',
  LOVE: 'love',
  SULKY: 'sulky',
  EMBARRASSED: 'shy',
};

/** 속마음이 짓게 할 표정. 감정이 있으면 감정을, 없거나 모르는 값이면 종류를 따른다 */
const expressionOf = ({
  type,
  emotion,
}: FloatingThought): CharacterExpression =>
  (emotion && Object.hasOwn(BY_EMOTION, emotion) && BY_EMOTION[emotion]) ||
  toThoughtExpression(type);

/**
 * 지금 캐릭터의 겉모습. 자세는 대화 단계를 따르고,
 * 말풍선에 마지막으로 뜬 속마음이 있으면 그 감정이 표정으로 남는다 — 다음 속마음이 올 때까지 유지한다.
 */
export const toCharacterLook = (
  phase: ConversationPhase,
  expressedThought: FloatingThought | null,
): CharacterLook => ({
  posture: BY_PHASE[phase],
  expression: expressedThought ? expressionOf(expressedThought) : 'neutral',
});
