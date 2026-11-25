// 키보드 입력창 — 키보드로 답하거나 말한 문장을 고칠 때 대화 칸 아래에 선다. 쓰고 그 자리에서 보낸다.
// 답변은 영어로만 받는다 — 웹은 자판 언어를 고정할 수 없어 영어 대화에 필요 없는 글자를 걸러 낸다
'use client';

import {
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';

import { haptic } from '@/shared/haptics';
import { ArrowUpIcon, CloseIcon } from '@/shared/ui/Icons';
import { showToast } from '@/shared/ui/toast';

import { ANSWER_MAX_LENGTH } from '../../model/answer-length';
import { hasNonEnglish, removeNonEnglish } from '../../model/english-only';

// 글자 수를 보이기 시작하는 지점 — 한도의 90%
const COUNTER_FROM = ANSWER_MAX_LENGTH * 0.9;

interface TranscriptEditorProps {
  text: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
}

export const TranscriptEditor = ({
  text,
  onChange,
  onSubmit,
  onCancel,
}: TranscriptEditorProps) => {
  const t = useTranslations('conversation.transcriptEditor');
  const limitNotice = t('limitToast', {
    max: ANSWER_MAX_LENGTH.toLocaleString(),
  });
  // 조합 중에 글자를 지우면 입력기가 꼬여 글자가 깨진다 — 조합이 끝난 뒤에 거른다
  const composingRef = useRef(false);
  // 막은 한글을 키보드는 아직 있다고 믿는다 — 그 글자 수. iOS 한글 키보드는 조합을 "지우고 다시 넣기"로 해서,
  // 이만큼의 지우기는 막은 글자를 지우려는 것이다. 그대로 두면 앞 영어가 지워진다
  const blockedRef = useRef(0);
  // 글자가 안 써지는 순간을 바로 알아채게 박스를 흔든다. 끝나면 거둬야 다음에 다시 흔들 수 있다
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const counterId = useId();
  // 칸이 줄어 앞부분이 위로 넘쳤는지 — 답변 칸처럼 윗변을 흐려 반쯤 잘린 줄이 보이지 않게 한다
  const [clipped, setClipped] = useState(false);

  // 열리면 커서를 문장 끝에 둔다 — 브라우저는 채워진 글 앞에 두는데, 말한 문장을 고치거나 이어 쓰는 자리는 끝이다.
  // 처음 한 번만이다. 그 뒤엔 사용자가 누른 자리를 존중한다
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.setSelectionRange(input.value.length, input.value.length);
    // 긴 답은 입력창 높이를 넘는다 — 커서가 있는 끝이 보이게 내려 둔다
    input.scrollTop = input.scrollHeight;
    setClipped(input.scrollTop > 0);
  }, []);

  // 글 높이만큼 늘린다 — 남는 자리를 두고 좁은 칸 안에서 스크롤하지 않게. 자리가 모자라면 칸이 줄고 안에서 스크롤된다
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
  }, [text]);

  // 글자가 걸러졌다는 걸 흔들림·진동·토스트로 바로 알린다
  const warnNonEnglish = () => {
    setShaking(true);
    haptic('warning');
    // 이어 치는 동안 계속 띄워도 토스트는 그대로 떠 있고 시간만 늘어난다
    showToast(t('englishOnlyToast'), 'warning');
  };

  // 조합 없이 바로 넣는 키보드의 한글은 들어가기 전에 막는다 — 넣은 뒤 지우면 키보드가 기억하는 글과 어긋난다.
  // 조합으로 넣는 키보드(안드로이드 등)는 이 신호를 막을 수 없어 아래 조합 끝 거르기가 맡는다
  const guardKeyboardInput = useEffectEvent((event: InputEvent) => {
    if (event.inputType === 'insertText' && event.data != null) {
      // 띄어쓰기·영어를 치면 키보드가 합치던 글자를 끝낸다
      if (!hasNonEnglish(event.data)) {
        blockedRef.current = 0;
        return;
      }
      event.preventDefault();
      blockedRef.current += event.data.length;
      warnNonEnglish();
      return;
    }
    if (event.inputType === 'deleteContentBackward' && blockedRef.current > 0) {
      event.preventDefault();
      blockedRef.current -= 1;
    }
  });
  // React의 onBeforeInput은 inputType을 주지 않아 실제 이벤트를 직접 듣는다
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.addEventListener('beforeinput', guardKeyboardInput);
    return () => input.removeEventListener('beforeinput', guardKeyboardInput);
  }, []);

  // 걸러 내고 한도에서 자른 뒤 넘긴다. 지운 만큼 커서를 당겨 쓰던 자리에 둔다
  const acceptTyping = (input: HTMLTextAreaElement) => {
    const { value, selectionStart } = input;
    const english = removeNonEnglish(value);
    // 고친 글과 커서를 그 자리에서 바로 쓴다 — 다음 프레임에 놓으면 그사이 들어온 글자(띄어쓰기 등) 앞으로 커서가 돌아간다.
    // 입력창을 떠난 뒤 거른 경우엔 커서를 건드리지 않는다
    const writeBack = (next: string, caret: number) => {
      input.value = next;
      if (document.activeElement === input)
        input.setSelectionRange(caret, caret);
    };
    // 한도를 넘기면 방금 끼워 넣은 글만 자른다 — 커서 뒤에 있던 글은 그대로 두어야 중간에 써도 뒷부분이 사라지지 않는다
    if (english.length > ANSWER_MAX_LENGTH) {
      const caret = removeNonEnglish(value.slice(0, selectionStart)).length;
      const after = english.slice(caret);
      const before = english
        .slice(0, caret)
        .slice(0, ANSWER_MAX_LENGTH - after.length);
      writeBack(before + after, before.length);
      onChange?.(before + after);
      setShaking(true);
      haptic('warning');
      showToast(limitNotice, 'warning');
      return;
    }
    onChange?.(english);
    // 분해형 악센트를 합치기만 한 것은 지운 게 아니다 — 합친 원문과 비교한다
    if (english === value.normalize('NFC')) return;
    writeBack(english, removeNonEnglish(value.slice(0, selectionStart)).length);
    warnNonEnglish();
  };

  return (
    <div
      onAnimationEnd={() => setShaking(false)}
      // 간격·여백·글자는 답변 칸과 같다 — 확인 칸을 눌러 열 때 글이 제자리에 있어야 같은 칸이 입력 상태가 된 것으로 읽힌다
      // 글이 길면 칸도 자라고, 자리가 모자라면 줄어 안에서 스크롤된다 — 보내기 버튼은 늘 칸 안에 남는다
      className={`mt-3 flex w-full shrink flex-col rounded-2xl border border-primary bg-card px-5 py-3 ${shaking ? 'animate-shake' : ''}`}
      // 줄어도 라벨·두 줄·보내기 버튼까지는 남긴다 — 여백·테두리·간격·버튼(4.5rem) + 라벨 줄 + 글 두 줄
      style={{
        minHeight:
          'calc(4.5rem + max(1rem, 1rem * var(--font-scale)) + 2.75rem * var(--font-scale))',
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">
          {t('headerLabel')}
        </p>
        {/* 한도에 가까워졌을 때만 글자 수를 보인다 — 늘 띄우면 짧은 답에도 숫자를 신경 쓰게 된다 */}
        {text.length >= COUNTER_FROM && (
          <p
            id={counterId}
            className={`mr-2 ml-auto text-xs font-semibold tabular-nums ${text.length >= ANSWER_MAX_LENGTH ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {text.length.toLocaleString()}/{ANSWER_MAX_LENGTH.toLocaleString()}
          </p>
        )}
        <button
          onClick={onCancel}
          aria-label={t('cancelButton')}
          // 라벨 줄 높이를 늘리지 않게 위아래를 덜어 낸다 — 늘면 아래 글이 그만큼 밀려 내려간다.
          // 열리는 순간 제자리에서 톡 솟는다 — 칸은 그대로고 새로 생긴 버튼만 움직여 같은 칸이 열린 것으로 읽힌다
          className="animate-control-in -my-1.5 flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground active:scale-95"
        >
          <CloseIcon size={16} strokeWidth={2.5} />
        </button>
      </div>
      {/* 토스트는 화면 읽기에 닿지 않는다 — 한도에 닿은 걸 따로 읽어 준다 */}
      <p role="status" className="sr-only">
        {text.length >= ANSWER_MAX_LENGTH ? limitNotice : ''}
      </p>
      <textarea
        ref={inputRef}
        autoFocus
        aria-describedby={text.length >= COUNTER_FROM ? counterId : undefined}
        value={text}
        onCompositionStart={() => {
          composingRef.current = true;
        }}
        onCompositionEnd={(event) => {
          composingRef.current = false;
          acceptTyping(event.currentTarget);
        }}
        // 조합 끝 신호를 빠뜨리는 키보드가 있다 — 입력창을 떠나면 조합도 끝난 것으로 보고 남은 글자를 거른다
        onBlur={(event) => {
          // 입력창을 떠나면 키보드도 합치던 글자를 잊는다
          blockedRef.current = 0;
          if (!composingRef.current) return;
          composingRef.current = false;
          acceptTyping(event.currentTarget);
        }}
        // 커서를 옮기면 키보드는 합치던 글자를 잊는다
        onPointerDown={() => {
          blockedRef.current = 0;
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
        placeholder={t('placeholder')}
        rows={2}
        onScroll={(event) => setClipped(event.currentTarget.scrollTop > 0)}
        // 글은 칸 너비를 다 쓴다. 높이는 글만큼이고, 칸이 줄면 두 줄까지만 같이 줄어 안에서 스크롤된다
        className={`mt-1.5 min-h-[2lh] w-full shrink resize-none bg-transparent text-base leading-snug font-semibold text-foreground outline-none placeholder:text-muted-foreground/50 ${
          clipped
            ? '[mask-image:linear-gradient(to_bottom,transparent,#000_1.75rem)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,#000_1.75rem)]'
            : ''
        }`}
      />
      <div className="flex flex-none justify-end">
        <button
          onClick={onSubmit}
          disabled={!text.trim()}
          aria-label={t('sendButton')}
          // X보다 한 박자 늦게 — 위에서 아래로 차례로 열린다
          style={{ '--delay': '50ms' } as React.CSSProperties}
          className="animate-control-in flex size-10 flex-none items-center justify-center rounded-full bg-primary text-white transition-opacity active:scale-95 disabled:opacity-30"
        >
          <ArrowUpIcon size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
