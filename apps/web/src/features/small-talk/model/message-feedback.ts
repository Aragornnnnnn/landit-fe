// 사용자 메시지의 교정 판단 — 아직 만드는 중인지
import type { SmallTalkHistoryMessage } from '../api/small-talk';

// 교정을 아직 만드는 중인 사용자 메시지가 있는가 — 있으면 세션을 다시 물어야 한다
export const hasPendingCorrection = (messages: SmallTalkHistoryMessage[]) =>
  messages.some((message) => message.correctionStatus === 'PREPARING');
