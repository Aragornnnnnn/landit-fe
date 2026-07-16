// 내 답변 섹션 — 항상 자리를 지키고, 길어지면 최근 발화(끝)만 보이게 앞부분을 흐린다. 듣는 중엔 커서가 깜빡인다.
// 키보드 입력 모드(editing)에선 이 박스가 그대로 입력창이 된다 — 별도 입력바 없이 답변 자리에서 쓰고 보낸다.
'use client';

import { ArrowRightIcon, CloseIcon } from '@/shared/ui/Icons';

import type { ConversationPhase } from '../model/conversationMachine';
import { TypingCursor } from './TypingCursor';

interface UserTranscriptProps {
  text: string;
  phase: ConversationPhase;
  // 키보드 입력 모드 — 박스가 입력창이 되고 보내기/취소 버튼이 붙는다
  editing?: boolean;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
}

export const UserTranscript = ({
  text,
  phase,
  editing = false,
  onChange,
  onSubmit,
  onCancel,
}: UserTranscriptProps) => {
  const listening = phase === 'USER_LISTENING';
  // 길면 스크롤 대신 하단 정렬 + 상단 페이드 — 방금 한 말(끝)이 항상 보이고 앞은 …처럼 흐려진다
  const clamped = text.length > 100;

  if (editing) {
    return (
      <div className="mt-4 w-full rounded-2xl border border-primary bg-card px-5 py-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">내 답변</p>
          <button
            onClick={onCancel}
            aria-label="입력 취소"
            className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground active:scale-95"
          >
            <CloseIcon size={16} strokeWidth={2.5} />
          </button>
        </div>
        <textarea
          autoFocus
          value={text}
          onChange={(event) => onChange?.(event.target.value)}
          onKeyDown={(event) => {
            // Enter는 전송, Shift+Enter만 줄바꿈 — 모바일 키보드의 완료 동작과 맞춘다
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (text.trim()) onSubmit?.();
            }
          }}
          placeholder="답변을 입력하세요"
          rows={2}
          className="mt-1.5 max-h-[14dvh] w-full resize-none bg-transparent text-lg leading-relaxed font-semibold text-foreground outline-none placeholder:text-muted-foreground/50"
        />
        <div className="flex justify-end">
          <button
            onClick={onSubmit}
            disabled={!text.trim()}
            aria-label="답변 전송"
            className="flex size-10 items-center justify-center rounded-full bg-primary text-white transition-opacity active:scale-95 disabled:opacity-30"
          >
            <ArrowRightIcon size={20} />
          </button>
        </div>
      </div>
    );
  }

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
