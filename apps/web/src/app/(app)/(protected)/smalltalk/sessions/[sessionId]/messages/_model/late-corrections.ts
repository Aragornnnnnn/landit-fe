// 교정을 만드는 중이던 말풍선을 기억한다 — 그 자리에 카드가 도착하면 떠오르게 하고,
// 들어올 때 이미 교정이 있던 말풍선은 그냥 그린다(긴 대화를 열자마자 카드가 줄줄이 흔들리면 어지럽다)
import type { SmallTalkHistoryMessage } from '@/features/small-talk/api/small-talk';

export const waitedCorrectionIds = (
  previous: ReadonlySet<number>,
  messages: SmallTalkHistoryMessage[],
): ReadonlySet<number> => {
  const next = new Set(previous);
  for (const message of messages) {
    if (message.correctionStatus === 'PREPARING') next.add(message.messageId);
  }
  // 새로 기다릴 것이 없으면 같은 집합을 돌려준다 — 렌더마다 새 집합을 만들면 보는 쪽이 매번 다시 그린다
  return next.size === previous.size ? previous : next;
};
