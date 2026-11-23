// 지금 차례 내 말풍선의 상태 — 말하는 중·말한 뒤 확인·보냄·보내지 못함. 대화 칸 오른쪽 아래 한 자리를 이 상태가 그린다
import type { ConversationPhase } from './conversation-machine';

export type MyBubbleState = 'speaking' | 'review' | 'sent' | 'failed';

export const toMyBubbleState = ({
  phase,
  reviewing,
  typing,
  unsent,
  text,
}: {
  phase: ConversationPhase;
  reviewing: boolean;
  // 키보드로 쓰는 중 — 그동안은 입력창이 내 말을 든다
  typing: boolean;
  // 보내지 못한 답변이 남아 다시 보내기를 기다린다
  unsent: boolean;
  text: string;
}): MyBubbleState | null => {
  if (typing) return null;
  // 다시 보내는 중에도 보내지 못한 표시가 남아 있다 — 지금 보내는 중이면 보낸 말풍선으로 둔다
  if (phase === 'AI_THINKING') return text ? 'sent' : null;
  if (unsent) return 'failed';
  if (phase === 'USER_SPEAKING') return reviewing ? 'review' : 'speaking';
  return null;
};
