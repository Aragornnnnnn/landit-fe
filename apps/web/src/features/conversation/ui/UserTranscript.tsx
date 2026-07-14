// 내 답변 섹션 — 항상 자리를 지키고, 길어지면 최근 발화(끝)만 보이게 앞부분을 흐린다. 듣는 중엔 커서가 깜빡인다
'use client';

import type { ConversationPhase } from '../model/conversationMachine';
import { TypingCursor } from './TypingCursor';

interface UserTranscriptProps {
  text: string;
  phase: ConversationPhase;
}

export const UserTranscript = ({ text, phase }: UserTranscriptProps) => {
  const listening = phase === 'USER_LISTENING';
  // 길면 스크롤 대신 하단 정렬 + 상단 페이드 — 방금 한 말(끝)이 항상 보이고 앞은 …처럼 흐려진다
  const clamped = text.length > 100;

  return (
    <div className="mt-4 min-h-28 w-full rounded-2xl border border-border/60 bg-muted/50 px-5 py-4">
      <p className="text-xs font-semibold text-muted-foreground">내 답변</p>
      <div
        className={`mt-1.5 flex max-h-[14dvh] min-h-7 flex-col overflow-hidden ${
          clamped
            ? 'justify-end [mask-image:linear-gradient(to_bottom,transparent,#000_1.75rem)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,#000_1.75rem)]'
            : ''
        }`}
      >
        <p className="text-lg leading-relaxed font-semibold text-foreground">
          {text}
          {listening && <TypingCursor />}
        </p>
      </div>
    </div>
  );
};
