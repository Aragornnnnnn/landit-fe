// 내 답변 섹션 — 늘 같은 자리에 얇게 선다. 말하는 중에 읽는 건 방금 뱉은 끝부분이라 두 줄이면 되고,
// 그 이상은 질문 카드에 넘긴다. 길어지면 끝만 보이게 앞을 흐린다.
// 키보드 입력 모드(editing)에선 이 박스가 그대로 입력창이 된다 — 별도 입력바 없이 답변 자리에서 쓰고 보낸다.
'use client';

import { useDeferredValue, useEffect, useRef, useState } from 'react';

import { ArrowRightIcon, CloseIcon } from '@/shared/ui/Icons';

import type { ConversationPhase } from '../../model/conversation-machine';
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
  const listening = phase === 'USER_SPEAKING';
  const boxRef = useRef<HTMLDivElement>(null);
  // 넘쳐서 앞부분이 잘렸는지 — 잘렸을 때만 윗변을 흐린다. 짧은 답변의 첫 줄까지 흐려지면 안 된다
  const [clipped, setClipped] = useState(false);
  // STT interim이 말하는 동안 초당 여러 번 들어와 text가 바뀐다 — 그때마다 강제 리플로우를 돌리면
  // 메인 스레드가 밀려 화면 전체가 버벅여 보인다. deferred 값으로 늦춰 브라우저가 한가할 때만 계산한다
  const deferredText = useDeferredValue(text);

  // 말이 길어지면 끝이 보이게 아래로 붙인다. 짧으면 그대로 라벨 밑에서 시작한다
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    box.scrollTop = box.scrollHeight;
    setClipped(box.scrollTop > 0);
  }, [deferredText]);

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
    <div className="mt-3 flex h-28 w-full flex-none flex-col rounded-2xl border border-border/60 bg-muted/50 px-5 py-3">
      <p className="text-xs font-semibold text-muted-foreground">내 답변</p>
      {/* 넘치면 끝으로 붙이고 윗변을 흐린다 — 방금 한 말이 항상 보이고 앞은 …처럼 사라진다 */}
      <div
        ref={boxRef}
        className={`mt-1.5 min-h-0 flex-1 overflow-hidden ${
          clipped
            ? '[mask-image:linear-gradient(to_bottom,transparent,#000_1.75rem)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,#000_1.75rem)]'
            : ''
        }`}
      >
        {/* 같은 높이에 세 줄이 들어오는 조합 — 글자 16px에 줄 간격을 좁혀 잡았다 */}
        <p className="text-base leading-snug font-semibold text-foreground">
          {text}
          {listening && <TypingCursor />}
        </p>
      </div>
    </div>
  );
};
