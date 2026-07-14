// 타자기 애니메이션 — 여러 문구를 순서대로 쳤다 지웠다 하다가 마지막 문구에서 멈춘다
'use client';

import { useEffect, useState } from 'react';

export type TypewriterMode = 'typing' | 'holding' | 'deleting' | 'done';

export interface TypewriterState {
  phraseIndex: number;
  charCount: number;
  mode: TypewriterMode;
  holdTicks: number;
}

export const initialTypewriterState: TypewriterState = {
  phraseIndex: 0,
  charCount: 0,
  mode: 'typing',
  holdTicks: 0,
};

// 한 틱 전진 — 마지막 문구는 지우지 않고 done으로 고정한다 (앞 문구들만 쳤다 지운다)
export const stepTypewriter = (
  state: TypewriterState,
  phrases: string[],
  holdTicks: number,
): TypewriterState => {
  const isLast = state.phraseIndex >= phrases.length - 1;
  const phrase = phrases[state.phraseIndex] ?? '';

  switch (state.mode) {
    case 'typing':
      if (state.charCount < phrase.length) {
        return { ...state, charCount: state.charCount + 1 };
      }
      return isLast
        ? { ...state, mode: 'done' }
        : { ...state, mode: 'holding', holdTicks: 0 };
    case 'holding':
      if (state.holdTicks < holdTicks) {
        return { ...state, holdTicks: state.holdTicks + 1 };
      }
      return { ...state, mode: 'deleting' };
    case 'deleting':
      if (state.charCount > 0) {
        return { ...state, charCount: state.charCount - 1 };
      }
      return { ...state, phraseIndex: state.phraseIndex + 1, mode: 'typing' };
    case 'done':
      return state;
  }
};

export const typewriterText = (state: TypewriterState, phrases: string[]) =>
  (phrases[state.phraseIndex] ?? '').slice(0, state.charCount);

interface TypewriterOptions {
  tickMs?: number;
  holdTicks?: number;
}

export const useTypewriter = (
  phrases: string[],
  { tickMs = 55, holdTicks = 16 }: TypewriterOptions = {},
) => {
  // 문구 내용이 바뀌면 애니메이션을 처음부터 다시 시작한다 — 내용을 key로 삼는다
  const key = phrases.join('');
  const [state, setState] = useState(() => ({
    tw: initialTypewriterState,
    key,
  }));

  // key가 바뀌면 렌더 중 리셋 — React 공식 "이전 렌더 정보로 state 조정" 패턴 (effect 아님)
  if (state.key !== key) {
    setState({ tw: initialTypewriterState, key });
  }

  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) =>
        prev.tw.mode === 'done'
          ? prev
          : { ...prev, tw: stepTypewriter(prev.tw, phrases, holdTicks) },
      );
    }, tickMs);
    return () => clearInterval(id);
    // phrases 내용은 key가 대표한다 — 참조만 바뀐 배열로 interval을 재설치하지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tickMs, holdTicks]);

  return {
    text: typewriterText(state.tw, phrases),
    done: state.tw.mode === 'done',
  };
};
