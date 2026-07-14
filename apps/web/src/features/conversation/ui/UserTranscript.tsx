// 내 답변 섹션 — 항상 자리를 지키고, 듣는 중엔 커서가 깜빡이며 좌→우로 채워지다 완료되면 고정된다
'use client';

import type { ConversationPhase } from '../model/conversationMachine';
import { TypingCursor } from './TypingCursor';

interface UserTranscriptProps {
  text: string;
  phase: ConversationPhase;
}

export const UserTranscript = ({ text, phase }: UserTranscriptProps) => {
  const listening = phase === 'USER_LISTENING';

  return (
    <div className="mt-4 min-h-28 w-full rounded-2xl border border-border/60 bg-muted/50 px-5 py-4">
      <p className="text-xs font-semibold text-muted-foreground">내 답변</p>
      {/* 답변이 길어도 레이아웃을 밀지 않도록 박스 안에서 스크롤 */}
      <p className="mt-1.5 max-h-[14dvh] min-h-7 overflow-y-auto text-lg leading-relaxed font-semibold text-foreground">
        {text}
        {listening && <TypingCursor />}
      </p>
    </div>
  );
};
