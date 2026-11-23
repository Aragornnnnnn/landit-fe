// 속마음 도메인 타입 — 종류(긍정/중립/부정)와 화면에 떠오르는 속마음 데이터 모양
export type ThoughtType = 'GOOD' | 'NORMAL' | 'BAD';

export interface FloatingThought {
  text: string;
  type: ThoughtType;
  // 서버가 판별한 캐릭터 감정 (백엔드 문자열 그대로). 없으면 표정은 종류로 정한다
  emotion?: string | null;
}
