// 초대 코드 8칸 — 보이지 않는 입력칸 하나가 칸 전체를 덮어 받고, 칸은 그 값을 한 글자씩 그린다.
// 붙여넣으면 글 전체에서 코드만 찾아 넣는다 (카톡 메시지를 통째로 복사해 와도 된다)
'use client';

import { useEffect, useRef, useState } from 'react';

import {
  cleanTypedReferralCode,
  findReferralCode,
  REFERRAL_CODE_LENGTH,
} from '../model/referral-code';

// checking — 서버가 확인하는 중, ok — 확인됨, error — 거절됨. 칸은 그대로 두고 글자 색만 바꾼다(테두리에 색을 넣으면 촌스럽다)
export type CodeInputTone = 'idle' | 'checking' | 'ok' | 'error';

// 네 칸씩 끊어 보이게 가운데에 줄표 — 공유 문구는 붙여 쓰지만 눈으로 옮겨 칠 때 덜 틀린다
const GROUP_SIZE = 4;

export const ReferralCodeInput = ({
  value,
  tone,
  onType,
  onPaste,
}: {
  value: string;
  tone: CodeInputTone;
  onType: (code: string) => void;
  // 붙여넣은 글에서 찾은 코드. 못 찾으면 null
  onPaste: (code: string | null) => void;
}) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 다 차면 키보드를 내린다 — 확인 결과와 그다음 연출이 키보드에 가리지 않게
  useEffect(() => {
    if (value.length === REFERRAL_CODE_LENGTH) inputRef.current?.blur();
  }, [value]);

  // 붙여넣기 이벤트 없이 글이 한꺼번에 들어오는 길도 있다 — 키보드의 클립보드 칩·제안 바. 한 번에 두 자 넘게 늘었으면 붙여넣은 것으로 본다
  const changeText = (raw: string) => {
    if (raw.length - value.length > 1) {
      const found = findReferralCode(raw);
      if (found) return onPaste(found);
    }
    onType(cleanTypedReferralCode(raw));
  };

  return (
    // gap-1 — 칸 8개(36px)와 줄표가 좁은 폰의 본문 폭(342px) 안에 들어가게
    // 거절되면 칸 묶음이 한 번 흔들린다 — 다시 거절되면 확인 중을 거쳐 클래스가 새로 붙어 다시 흔들린다
    <div
      className={`relative mx-auto flex items-center justify-center gap-1 ${tone === 'error' ? 'animate-shake' : ''}`}
    >
      {Array.from({ length: REFERRAL_CODE_LENGTH }, (_, index) => (
        <CodeCell
          key={index}
          index={index}
          char={value[index] ?? ''}
          divider={index === GROUP_SIZE}
          tone={tone}
          // 칸에 포커스가 있을 때 다음에 채울 칸만 주황 테두리 — 어디에 들어갈지와 키보드가 이 칸에 있다는 걸 같이 보인다
          current={focused && tone === 'idle' && index === value.length}
        />
      ))}
      <input
        ref={inputRef}
        aria-label="초대 코드"
        value={value}
        inputMode="text"
        autoCapitalize="characters"
        // 문자 인증번호 제안(one-time-code)이 뜨지 않게 끈다 — 이 코드는 문자로 오지 않는다
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => changeText(event.target.value)}
        onPaste={(event) => {
          event.preventDefault();
          onPaste(findReferralCode(event.clipboardData.getData('text')));
        }}
        // 글자는 칸이 그린다 — 입력칸은 투명하게 칸 전체를 덮어 어디를 눌러도 키보드가 뜨고, 길게 누르면 붙여넣기 메뉴가 뜬다
        // text-base — 16px보다 작으면 iOS가 누를 때 화면을 확대한다
        className="absolute inset-0 h-full w-full cursor-text bg-transparent text-base text-transparent caret-transparent outline-none selection:bg-transparent"
      />
    </div>
  );
};

const CodeCell = ({
  index,
  char,
  divider,
  tone,
  current,
}: {
  index: number;
  char: string;
  divider: boolean;
  tone: CodeInputTone;
  current: boolean;
}) => (
  <>
    {divider && (
      <span aria-hidden className="text-lg font-bold text-border">
        –
      </span>
    )}
    <span
      aria-hidden
      className={`flex h-[50px] w-9 items-center justify-center rounded-[10px] bg-card text-[22px] font-bold ${borderOf(current)}`}
    >
      <span
        className={charClassOf(tone)}
        // 확인 중엔 빛이 왼쪽→오른쪽으로 훑고, 확인되면 왼쪽부터 한 칸씩 초록으로 톡 튄다
        style={
          tone === 'checking' || tone === 'ok'
            ? { animationDelay: `${index * (tone === 'checking' ? 90 : 40)}ms` }
            : undefined
        }
      >
        {char}
      </span>
    </span>
  </>
);

// CSS 애니메이션 — rAF가 멎은 웹뷰에서도 돈다 (LAN-375 교훈)
const charClassOf = (tone: CodeInputTone) => {
  if (tone === 'checking')
    return 'inline-block animate-[code-wave_0.9s_ease-in-out_infinite] text-foreground';
  if (tone === 'ok')
    return 'inline-block animate-[code-pop_0.32s_ease-out_both] text-success';
  if (tone === 'error') return 'text-destructive';
  return 'text-foreground';
};

// 다음에 채울 칸만 주황
const borderOf = (current: boolean) => {
  if (current) return 'border-2 border-primary';
  return 'border-[1.5px] border-border';
};
