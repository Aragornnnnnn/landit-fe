// 롤플레이 기록 메시지를 스몰톡과 같이 쓰는 말풍선이 읽는 모양으로 바꾼다
import type { RoleplayHistoryMessage } from '@/features/roleplay/api/roleplay';
import type { TranscriptMessage } from '@/features/small-talk/ui/TranscriptMessages';

// 문장별 교정은 스몰톡과 같은 모양으로 오고, 교정 상태만 correction 안에 들어 있다
export const toTranscriptMessage = (
  message: RoleplayHistoryMessage,
): TranscriptMessage & Pick<RoleplayHistoryMessage, 'role'> => ({
  messageId: message.messageId,
  role: message.role,
  content: message.content,
  translatedContent: message.translatedContent,
  reusedExpression: message.reusedExpression,
  correctionStatus: message.correction?.status,
  sentences: message.sentences,
});
