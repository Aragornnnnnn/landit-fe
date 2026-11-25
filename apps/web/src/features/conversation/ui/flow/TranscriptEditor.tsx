// 키보드 입력바 — 키보드로 답하거나 말한 문장을 고칠 때 화면 폭으로 키보드 위에 선다. 닫기 버튼 없이 밖을 누르거나 키보드를 내리면 닫힌다.
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
import { ArrowUpIcon } from '@/shared/ui/Icons';
import { showToast } from '@/shared/ui/toast';

import { ANSWER_MAX_LENGTH } from '../../model/answer-length';
import { hasNonEnglish, removeNonEnglish } from '../../model/english-only';

// 누른 채 이만큼 넘게 움직이면 누른 게 아니라 끈 것이다 — 대화 칸 스크롤을 닫기로 오해하지 않게
const TAP_SLOP_PX = 10;
// 입력바 안(보내기 버튼 등)을 누른 뒤 이 시간 안에 오는 떠남 신호는 닫기로 보지 않는다.
// iOS는 버튼이 포커스를 받지 않아, 보내기를 탭하면 떠남 신호가 보내기보다 먼저 온다 — 닫히면 보낸 글이 확인 단계로 빠진다
const PRESS_INSIDE_GRACE_MS = 600;

// 글자 수를 보이기 시작하는 지점 — 한도의 90%
const COUNTER_FROM = ANSWER_MAX_LENGTH * 0.9;

interface TranscriptEditorProps {
  text: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  // 입력창 밖을 누르거나 키보드를 내려 입력창을 떠난 순간 — 닫기 버튼은 없다. 쓴 글을 어떻게 둘지는 대화 쪽이 정한다
  onClose?: () => void;
}

export const TranscriptEditor = ({
  text,
  onChange,
  onSubmit,
  onClose,
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
  // 칸이 줄어 앞부분이 위로 넘쳤는지 — 윗변을 흐려 반쯤 잘린 줄이 보이지 않게 한다
  const [clipped, setClipped] = useState(false);
  // 두 줄 이상인가 — 한 줄일 땐 알약, 늘어나면 모서리를 덜 둥글게 한다
  const [multiline, setMultiline] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  // 입력바 안을 마지막으로 누른 시각 — 떠남 신호가 그 누름 때문인지 가린다
  const pressedInsideAtRef = useRef(-Infinity);
  // 밖을 누른 뒤 입력창을 떠나는 신호가 이어 와도 한 번만 닫는다. 보냈거나 화면에서 빠질 때도 닫지 않는다 —
  // 입력창이 사라지며 오는 떠남 신호로 보낸 글이 확인 단계에 남지 않게
  const closedRef = useRef(false);
  const close = () => {
    if (closedRef.current) return;
    closedRef.current = true;
    onClose?.();
  };
  // 문서에 한 번 붙여 두는 바깥 누름 감지가 최신 onClose를 부르도록
  const closeFromOutside = useEffectEvent(close);
  const submit = () => {
    if (!text.trim()) return;
    closedRef.current = true;
    onSubmit?.();
  };
  // 화면에서 빠지는 순간 — 입력창이 떠나는 신호보다 먼저 돈다. 다시 붙으면(개발 모드의 이중 실행) 되살린다
  useLayoutEffect(() => {
    closedRef.current = false;
    return () => {
      closedRef.current = true;
    };
  }, []);

  // 입력창 밖(캐릭터·말풍선)을 누르면 닫는다 — 눌러도 포커스를 가져가지 않는 자리라 떠나는 신호만으론 못 잡는다.
  // 끌어서 대화를 스크롤한 건 누른 게 아니다 — 손가락이 거의 그 자리에서 떨어졌을 때만 닫는다
  useEffect(() => {
    let pressedAt: { x: number; y: number } | null = null;
    const rememberOutsidePress = (event: PointerEvent) => {
      pressedAt = barRef.current?.contains(event.target as Node)
        ? null
        : { x: event.clientX, y: event.clientY };
    };
    const closeOnOutsideTap = (event: PointerEvent) => {
      if (!pressedAt) return;
      const moved = Math.hypot(
        event.clientX - pressedAt.x,
        event.clientY - pressedAt.y,
      );
      pressedAt = null;
      if (moved <= TAP_SLOP_PX) closeFromOutside();
    };
    document.addEventListener('pointerdown', rememberOutsidePress);
    document.addEventListener('pointerup', closeOnOutsideTap);
    return () => {
      document.removeEventListener('pointerdown', rememberOutsidePress);
      document.removeEventListener('pointerup', closeOnOutsideTap);
    };
  }, []);

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
    const lineHeight = parseFloat(getComputedStyle(input).lineHeight);
    setMultiline(input.scrollHeight > lineHeight * 1.5);
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
    // 화면 폭을 다 쓰는 입력바 — 키보드 바로 위에 붙고, 글이 늘면 네 줄까지 위로 자란다
    <div
      ref={barRef}
      onPointerDown={() => {
        pressedInsideAtRef.current = performance.now();
      }}
      className="flex w-full flex-none flex-col border-t border-border bg-muted px-3 py-2"
    >
      <div
        onAnimationEnd={() => setShaking(false)}
        className={`flex items-end gap-1.5 border-[1.5px] border-primary bg-card py-[3px] pr-[3px] pl-3.5 ${multiline ? 'rounded-[20px]' : 'rounded-full'} ${shaking ? 'animate-shake' : ''}`}
      >
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
          // 키보드를 내려 입력창을 떠나면 닫는다. 조합 끝 신호를 빠뜨리는 키보드가 있어, 그 전에 남은 글자를 거른다
          onBlur={(event) => {
            // 입력창을 떠나면 키보드도 합치던 글자를 잊는다
            blockedRef.current = 0;
            if (composingRef.current) {
              composingRef.current = false;
              acceptTyping(event.currentTarget);
            }
            if (barRef.current?.contains(event.relatedTarget as Node | null))
              return;
            if (
              performance.now() - pressedInsideAtRef.current <
              PRESS_INSIDE_GRACE_MS
            )
              return;
            close();
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
              submit();
            }
          }}
          placeholder={t('placeholder')}
          rows={1}
          onScroll={(event) => setClipped(event.currentTarget.scrollTop > 0)}
          // 높이는 글만큼, 네 줄을 넘으면 안에서 스크롤된다
          className={`max-h-[calc(4lh+14px)] min-w-0 flex-1 resize-none bg-transparent py-[7px] text-16 leading-[1.35] font-medium text-foreground outline-none placeholder:text-muted-foreground/60 ${
            clipped
              ? '[mask-image:linear-gradient(to_bottom,transparent,#000_1.5rem)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,#000_1.5rem)]'
              : ''
          }`}
        />
        {/* 한도에 가까워졌을 때만 글자 수를 보인다 — 늘 띄우면 짧은 답에도 숫자를 신경 쓰게 된다 */}
        {text.length >= COUNTER_FROM && (
          <p
            id={counterId}
            className={`flex-none self-center text-xs font-semibold tabular-nums ${text.length >= ANSWER_MAX_LENGTH ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {text.length.toLocaleString()}/{ANSWER_MAX_LENGTH.toLocaleString()}
          </p>
        )}
        <button
          onClick={submit}
          // 눌러도 입력창에서 포커스를 빼앗지 않는다 — 빼앗기면 떠나는 신호로 입력창이 먼저 닫힌다
          onMouseDown={(event) => event.preventDefault()}
          disabled={!text.trim()}
          aria-label={t('sendButton')}
          className="flex size-[34px] flex-none items-center justify-center rounded-full bg-primary text-white transition-opacity active:scale-95 disabled:opacity-30"
        >
          <ArrowUpIcon size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
