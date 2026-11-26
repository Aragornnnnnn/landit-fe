// 속마음 도메인 타입 — 종류(긍정/중립/부정)와 화면에 떠오르는 속마음 데이터 모양
export type ThoughtType = 'GOOD' | 'NORMAL' | 'BAD';

export interface FloatingThought {
  text: string;
  type: ThoughtType;
  // 서버가 판별한 캐릭터 감정 (백엔드 문자열 그대로). 없으면 표정은 종류로 정한다
  emotion?: string | null;
}

/**
 * 상대 말풍선 맨 위 속마음 줄 — 오는 중이면 뼈대(pending), 오면 글(shown).
 * 속마음이 없는 대화나 생성에 실패한 턴은 줄 자체를 두지 않는다(null)
 */
export type BubbleThought =
  { status: 'pending' } | ({ status: 'shown' } & FloatingThought);
