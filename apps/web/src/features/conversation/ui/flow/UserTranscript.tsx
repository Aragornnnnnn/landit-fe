// 내 답변 섹션 — 늘 같은 자리에 얇게 선다. 말하는 중에 읽는 건 방금 뱉은 끝부분이라 두 줄이면 되고,
// 그 이상은 질문 카드에 넘긴다. 길어지면 끝만 보이게 앞을 흐린다.
// 키보드 입력 모드(editing)에선 이 박스가 그대로 입력창이 된다 — 별도 입력바 없이 답변 자리에서 쓰고 보낸다.
// 답변은 영어로만 받는다 — 웹은 자판 언어를 고정할 수 없어 영어 대화에 필요 없는 글자를 걸러 낸다.
// 말한 뒤 확인(onEdit을 받음)에선 칸이 입력창처럼 바뀐다(흰 바탕·주황 테두리·문장 끝 커서) — 이미 입력된 내 답변으로 읽히게.
// 칸 전체가 고치기 버튼이라 글자를 눌러도 바로 입력창으로 간다.
'use client';

import { useDeferredValue, useEffect, useRef, useState } from 'react';

import { haptic } from '@/shared/haptics';
import { ArrowUpIcon, CloseIcon, PencilIcon } from '@/shared/ui/Icons';
import { showToast } from '@/shared/ui/toast';

import type { ConversationPhase } from '../../model/conversation-machine';
import { removeNonEnglish } from '../../model/english-only';
import { ListeningDots } from './ListeningDots';
import { TypingCursor } from './TypingCursor';

interface UserTranscriptProps {
  text: string;
  phase: ConversationPhase;
  // 확정 전 말이 남아 있는가 — 다 확정되면 점을 거둔다
  speechPending?: boolean;
  // 키보드 입력 모드 — 박스가 입력창이 되고 보내기/취소 버튼이 붙는다
  editing?: boolean;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  // 라벨 오른쪽에 붙는 보조 버튼 — 끼울지와 무엇을 끼울지는 대화 쪽이 정한다
  headerAction?: React.ReactNode;
  // 끝내 전달되지 못한 답변 — 연한 빨강으로 묶어 무엇이 다시 보내지는지 보여 준다
  unsent?: boolean;
  // 말한 뒤 확인 중일 때만 준다 — 칸을 누르면 인식된 문장을 고치는 입력창으로 간다
  onEdit?: () => void;
}

export const UserTranscript = ({
  text,
  phase,
  speechPending = false,
  editing = false,
  onChange,
  onSubmit,
  onCancel,
  headerAction,
  unsent = false,
  onEdit,
}: UserTranscriptProps) => {
  const reviewing = onEdit != null;
  // 고치기 입력창을 닫고 확인 칸으로 돌아왔는가 — 이때는 칸이 다시 출렁이지 않고 안내만 살며시 돌아온다.
  // 확인이 끝나면(보내기·다시 말하기) 접어 둬야 다음 턴의 확인이 다시 출렁인다
  const [prevEditing, setPrevEditing] = useState(editing);
  const [backFromEditing, setBackFromEditing] = useState(false);
  if (editing !== prevEditing) {
    setPrevEditing(editing);
    setBackFromEditing(prevEditing && !editing);
  }
  if (!reviewing && !editing && backFromEditing) setBackFromEditing(false);
  // 확인 중엔 마이크가 꺼져 있다 — 단계는 말하는 중이어도 더 들을 말이 없다
  const listening = phase === 'USER_SPEAKING' && !reviewing;
  // 아직 아무 말도 확정 전이면 듣는 중 표시로, 그 뒤엔 확정 전 말이 남아 있을 때만 점을 띄운다
  const showDots = listening && (text === '' || speechPending);
  const boxRef = useRef<HTMLDivElement>(null);
  // 넘쳐서 앞부분이 잘렸는지 — 잘렸을 때만 윗변을 흐린다. 짧은 답변의 첫 줄까지 흐려지면 안 된다
  const [clipped, setClipped] = useState(false);
  // 말하는 동안 확정 문장이 붙을 때마다 text가 바뀐다 — 그때마다 강제 리플로우를 돌리면
  // 메인 스레드가 밀려 화면 전체가 버벅여 보인다. deferred 값으로 늦춰 브라우저가 한가할 때만 계산한다
  const deferredText = useDeferredValue(text);

  // 말이 길어지면 끝이 보이게 아래로 붙인다. 짧으면 그대로 라벨 밑에서 시작한다
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    box.scrollTop = box.scrollHeight;
    setClipped(box.scrollTop > 0);
    // 점이 나타나거나 사라져도 높이가 바뀐다 — 글자가 그대로여도 다시 맞춘다
  }, [deferredText, showDots]);

  if (editing) {
    return (
      <TranscriptEditor
        text={text}
        onChange={onChange}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );
  }

  const toneClass = () => {
    if (reviewing) return 'border-primary bg-card';
    if (unsent) return 'border-transparent bg-destructive/5';
    return 'border-border/60 bg-muted/50';
  };

  return (
    <div
      // 색은 이어서 바뀌고, 확인으로 들어서는 순간 한 번 살짝 내려앉는다 — 듣기가 끝나고 이제 내 차례라는 신호
      className={`mt-3 flex h-28 w-full flex-none flex-col rounded-2xl border px-5 py-3 transition-[background-color,border-color] duration-300 ease-out ${toneClass()} ${
        reviewing
          ? `cursor-pointer text-left ${backFromEditing ? '' : 'animate-review-in'}`
          : ''
      }`}
      // 안에 스크롤 영역이 있어 button 요소로는 감쌀 수 없다 — 역할과 키보드 조작을 직접 단다
      {...(reviewing && {
        role: 'button',
        tabIndex: 0,
        'aria-label': '답변 고치기',
        onClick: onEdit,
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          onEdit();
        },
      })}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">내 답변</p>
        {/* 서버가 받았는지는 모른다 — 아는 건 대답이 오지 않았다는 것뿐이라 연결 상태로만 말한다 */}
        {unsent && (
          <p role="status" className="text-xs font-semibold text-destructive">
            연결이 불안정해요
          </p>
        )}
        {/* 커서만으로는 누르면 고쳐진다는 걸 모른다 — 라벨과 같은 크기의 글로 할 수 있는 일을 알린다 */}
        {reviewing ? (
          <p
            className={`flex items-center gap-1 text-xs font-bold text-primary ${backFromEditing ? 'animate-hint-in' : ''}`}
          >
            <PencilIcon size={12} strokeWidth={2.25} />
            눌러서 고치기
          </p>
        ) : (
          headerAction
        )}
      </div>
      {/* 넘치면 끝으로 붙이고 윗변을 흐린다 — 방금 한 말이 항상 보이고 앞은 …처럼 사라진다.
          칸 높이는 그대로 두고 안에서만 스크롤해 앞부분을 다시 볼 수 있다 */}
      <div
        ref={boxRef}
        onScroll={(event) => setClipped(event.currentTarget.scrollTop > 0)}
        className={`mt-1.5 min-h-0 flex-1 overflow-y-auto overscroll-contain ${
          clipped
            ? '[mask-image:linear-gradient(to_bottom,transparent,#000_1.75rem)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,#000_1.75rem)]'
            : ''
        }`}
      >
        {/* 같은 높이에 세 줄이 들어오는 조합 — 글자 16px에 줄 간격을 좁혀 잡았다 */}
        <p className="text-base leading-snug font-semibold text-foreground">
          {text}
          {showDots && <ListeningDots spaced={text !== ''} />}
          {reviewing && <TypingCursor />}
        </p>
      </div>
    </div>
  );
};

// 키보드 입력 모드의 입력창 — 답변은 영어로만 받아서 그 밖의 글자를 걸러 낸다
const TranscriptEditor = ({
  text,
  onChange,
  onSubmit,
  onCancel,
}: Pick<
  UserTranscriptProps,
  'text' | 'onChange' | 'onSubmit' | 'onCancel'
>) => {
  // 조합 중에 글자를 지우면 입력기가 꼬여 글자가 깨진다 — 조합이 끝난 뒤에 거른다
  const composingRef = useRef(false);
  // 글자가 안 써지는 순간을 바로 알아채게 박스를 흔든다. 끝나면 거둬야 다음에 다시 흔들 수 있다
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 열리면 커서를 문장 끝에 둔다 — 브라우저는 채워진 글 앞에 두는데, 말한 문장을 고치거나 이어 쓰는 자리는 끝이다.
  // 처음 한 번만이다. 그 뒤엔 사용자가 누른 자리를 존중한다
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.setSelectionRange(input.value.length, input.value.length);
  }, []);

  // 글자가 걸러졌다는 걸 흔들림·진동·토스트로 바로 알린다
  const warnNonEnglish = () => {
    setShaking(true);
    haptic('error');
    // 이어 치는 동안 계속 띄워도 토스트는 그대로 떠 있고 시간만 늘어난다
    showToast('영어로만 입력해 주세요');
  };

  // 걸러 낸 뒤 넘긴다. 지운 만큼 커서를 당겨 쓰던 자리에 둔다
  const acceptTyping = (input: HTMLTextAreaElement) => {
    const { value, selectionStart } = input;
    const english = removeNonEnglish(value);
    onChange?.(english);
    if (english === value) return;
    warnNonEnglish();
    const caret = removeNonEnglish(value.slice(0, selectionStart)).length;
    requestAnimationFrame(() => input.setSelectionRange(caret, caret));
  };

  return (
    <div
      onAnimationEnd={() => setShaking(false)}
      // 자리가 모자라도 줄지 않는다 — 줄면 보내기 버튼이 칸 밖으로 넘쳐 키보드 뒤로 들어간다.
      // 간격·여백·글자는 답변 칸과 같다 — 확인 칸을 눌러 열 때 글이 제자리에 있어야 같은 칸이 입력 상태가 된 것으로 읽힌다
      className={`mt-3 w-full flex-none rounded-2xl border border-primary bg-card px-5 py-3 ${shaking ? 'animate-shake' : ''}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">내 답변</p>
        <button
          onClick={onCancel}
          aria-label="입력 취소"
          // 라벨 줄 높이를 늘리지 않게 위아래를 덜어 낸다 — 늘면 아래 글이 그만큼 밀려 내려간다.
          // 열리는 순간 제자리에서 톡 솟는다 — 칸은 그대로고 새로 생긴 버튼만 움직여 같은 칸이 열린 것으로 읽힌다
          className="animate-control-in -my-1.5 flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground active:scale-95"
        >
          <CloseIcon size={16} strokeWidth={2.5} />
        </button>
      </div>
      <textarea
        ref={inputRef}
        autoFocus
        value={text}
        onCompositionStart={() => {
          composingRef.current = true;
        }}
        onCompositionEnd={(event) => {
          composingRef.current = false;
          acceptTyping(event.currentTarget);
        }}
        // 조합 끝 신호를 빠뜨리는 키보드가 있다 — 입력창을 떠나면 조합도 끝난 것으로 본다
        onBlur={() => {
          composingRef.current = false;
        }}
        onChange={(event) => {
          if (composingRef.current) onChange?.(event.target.value);
          else acceptTyping(event.target);
        }}
        onKeyDown={(event) => {
          // 한글 조합을 끝내는 Enter는 전송이 아니다. Safari는 조합 끝 신호를 먼저 보내 isComposing 대신 229로 온다
          if (event.nativeEvent.isComposing || event.keyCode === 229) return;
          // Enter는 전송, Shift+Enter만 줄바꿈 — 모바일 키보드의 완료 동작과 맞춘다
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (text.trim()) onSubmit?.();
          }
        }}
        placeholder="답변을 입력하세요"
        rows={2}
        className="mt-1.5 max-h-[14dvh] w-full resize-none bg-transparent text-base leading-snug font-semibold text-foreground outline-none placeholder:text-muted-foreground/50"
      />
      <div className="flex justify-end">
        <button
          onClick={onSubmit}
          disabled={!text.trim()}
          aria-label="답변 전송"
          // X보다 한 박자 늦게 — 위에서 아래로 차례로 열린다
          style={{ '--delay': '50ms' } as React.CSSProperties}
          className="animate-control-in flex size-10 items-center justify-center rounded-full bg-primary text-white transition-opacity active:scale-95 disabled:opacity-30"
        >
          <ArrowUpIcon size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
