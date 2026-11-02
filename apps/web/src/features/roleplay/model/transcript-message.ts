// 롤플레이 기록 메시지를 스몰톡과 같이 쓰는 말풍선이 읽는 모양으로 바꾼다
import type { TranscriptMessage } from '@/features/small-talk/ui/TranscriptMessages';

import type { RoleplayHistoryMessage } from '../api/roleplay';

/**
 * @param message 백엔드가 준 기록 메시지
 * @param toMemoryTag 장기기억 근거의 월·일·내용으로 태그 문구를 만든다
 */
export const toTranscriptMessage = (
  message: RoleplayHistoryMessage,
  toMemoryTag: (month: number, day: number, label: string | null) => string,
): TranscriptMessage => {
  const sentence = message.correction?.sentence;
  const observedOn = sentence?.memoryObservedOn;

  return {
    messageId: message.messageId,
    content: message.content,
    translatedContent: message.translatedContent,
    reusedExpression: message.reusedExpression,
    correctionStatus: message.correction?.status,
    correction: sentence
      ? {
          originalSentence: sentence.originalSentence,
          betterSentence: sentence.betterSentence,
          reason: sentence.reason,
          mistakePattern: sentence.mistakePattern,
          memoryTag: observedOn
            ? toMemoryTag(
                Number(observedOn.slice(5, 7)),
                Number(observedOn.slice(8, 10)),
                sentence.memoryLabel,
              )
            : null,
        }
      : null,
  };
};
