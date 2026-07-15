'use client';

// 복습 영작(D안 ⑤) — 답변 박스를 누르면 네이티브 키보드가 뜨고, 그 입력이 기존 단어별 모델로 흘러간다.
// 답변은 단어별 박스로 그리고(자동 넘김·조기 이동·박스 클릭 수정 그대로), 오답은 흔들림+빨강, 정답이면 화려한 획득 연출.
import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

import { useKeyboardInset } from '@/shared/lib/useKeyboardInset';
import { CheckIcon } from '@/shared/ui/Icons';

import {
  advance,
  appendLetter,
  backspace,
  emptyState,
  firstWrong,
  focusWord,
  gradeWords,
  isComplete,
  parseInputEvent,
  type ReviewInputAction,
} from '../model/reviewInput';
import type { SentenceQuiz } from '../model/sentenceQuiz';
import { QuizPrompt } from './QuizPrompt';
import { ReviewSuccess } from './ReviewSuccess';
import { StepScaffold } from './StepScaffold';

interface ReviewInputStepProps {
  quiz: SentenceQuiz;
  // 완료 연출 카드에 띄울 표현·뜻
  targetExpressionText: string;
  meaning: string;
  onBack: () => void;
  onFinish: () => void;
  finishing: boolean;
}

// 숨은 입력에 항상 하나 남겨두는 문자 — 값이 비면 네이티브 키보드의 backspace가 input 이벤트를 안 쏘기 때문.
const SENTINEL = ' ';

export const ReviewInputStep = ({
  quiz,
  targetExpressionText,
  meaning,
  onBack,
  onFinish,
  finishing,
}: ReviewInputStepProps) => {
  const answer = quiz.answerWords;
  const lengths = answer.map((word) => word.length);

  const [state, setState] = useState(() => emptyState(answer.length));
  const [correct, setCorrect] = useState(false);
  const [wrongCount, setWrongCount] = useState<number[]>(() =>
    answer.map(() => 0),
  );
  const [wrongNow, setWrongNow] = useState<boolean[]>(() =>
    answer.map(() => false),
  );
  const [shakeNonce, setShakeNonce] = useState(0);

  const { typed, focus } = state;
  const canConfirm = isComplete(state);

  // 네이티브 키보드용 숨은 입력 — 여길 focus시켜 OS 키보드를 띄우고, 키 입력을 기존 모델로 흘려보낸다
  const hiddenRef = useRef<HTMLInputElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  // 조합입력(IME) 중엔 input 이벤트를 무시하고 compositionend에서 완성 문자열만 반영한다(중복 방지)
  const composingRef = useRef(false);
  const keyboardInset = useKeyboardInset();

  // 정답 순간 콘페티 — 브랜드 색으로 양쪽에서 터뜨린다
  useEffect(() => {
    if (!correct) return;
    const colors = ['#e07a3a', '#2f7d54', '#fbbf24', '#ffffff'];
    // ticks 150 ≈ 2.5초(60fps 기준). 3발 합쳐 155개 — 화려하되 과하지 않게.
    const base = { spread: 70, startVelocity: 45, ticks: 150, colors };
    confetti({
      ...base,
      particleCount: 55,
      angle: 60,
      origin: { x: 0, y: 0.9 },
    });
    confetti({
      ...base,
      particleCount: 55,
      angle: 120,
      origin: { x: 1, y: 0.9 },
    });
    confetti({
      ...base,
      particleCount: 45,
      spread: 110,
      origin: { x: 0.5, y: 0.6 },
    });
  }, [correct]);

  const clearWrong = () => setWrongNow(answer.map(() => false));

  const onKey = (letter: string) => {
    if (correct) return;
    setState((current) => appendLetter(current, letter, lengths));
    clearWrong();
  };

  const onSpace = () => {
    if (correct) return;
    setState((current) => advance(current, answer.length));
    clearWrong();
  };

  const onBackspace = () => {
    if (correct) return;
    setState((current) => backspace(current));
    clearWrong();
  };

  const check = () => {
    const ok = gradeWords(typed, answer);
    if (ok.every(Boolean)) {
      setCorrect(true);
      return;
    }
    setWrongNow(ok.map((isOk) => !isOk));
    setWrongCount((prev) => prev.map((c, i) => (ok[i] ? c : c + 1)));
    setShakeNonce((n) => n + 1);
    // 틀린 부분으로 커서를 보내 바로 고치게 한다
    setState((current) => focusWord(current, firstWrong(ok)));
  };

  // 숨은 입력은 항상 SENTINEL 하나만 담아 이벤트 소스로만 쓴다 — 처리 후 값·커서를 되돌린다
  const resetHidden = () => {
    const el = hiddenRef.current;
    if (!el) return;
    el.value = SENTINEL;
    el.setSelectionRange(SENTINEL.length, SENTINEL.length);
  };

  const focusHidden = () => hiddenRef.current?.focus();

  // 특정 단어 박스로 커서를 옮기고 키보드를 유지한다
  const focusBox = (w: number) => {
    if (correct) return;
    setState((s) => focusWord(s, w));
    focusHidden();
  };

  // 파싱된 액션을 기존 모델로 적용 — 글자는 appendLetter, 스페이스는 advance, 지우기는 backspace
  const applyActions = (actions: ReviewInputAction[]) => {
    for (const action of actions) {
      if (action.kind === 'backspace') onBackspace();
      else if (action.kind === 'space') onSpace();
      else onKey(action.letter);
    }
  };

  // 네이티브 키 입력 라우팅 — 조합입력(IME) 이벤트는 건너뛰고(중복 방지) compositionend에서 한 번만 반영한다
  const handleInput = (event: React.FormEvent<HTMLInputElement>) => {
    const native = event.nativeEvent as InputEvent;
    if (composingRef.current || native.inputType === 'insertCompositionText')
      return;
    applyActions(parseInputEvent(native.inputType ?? '', native.data ?? ''));
    resetHidden();
  };

  return (
    <StepScaffold
      progress={1}
      onBack={onBack}
      footerBleed
      bottomInset={keyboardInset}
      footer={
        correct ? undefined : (
          <div
            className="bg-secondary px-5 pt-3"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
          >
            <button
              type="button"
              // 버튼을 눌러도 입력창 포커스를 뺏지 않아 오답 수정 시 키보드가 유지된다
              onPointerDown={(event) => event.preventDefault()}
              onClick={check}
              disabled={!canConfirm}
              className={`flex h-12 w-full items-center justify-center gap-1.5 rounded-xl text-base font-bold transition-colors ${
                canConfirm
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground/50'
              }`}
            >
              <CheckIcon size={20} /> 확인
            </button>
          </div>
        )
      }
    >
      <QuizPrompt
        writingSentence={quiz}
        instruction="질문에 대한 대답을 입력해보세요"
      />

      {/* 숨은 네이티브 입력 — 박스를 누르면 여기 focus되어 OS 키보드가 뜬다. 화면엔 안 보이지만 focus 가능해야 하므로 display:none은 금물. */}
      <input
        ref={hiddenRef}
        defaultValue={SENTINEL}
        onInput={handleInput}
        onCompositionStart={() => {
          composingRef.current = true;
        }}
        onCompositionEnd={(event) => {
          composingRef.current = false;
          // 완성된 조합 문자열을 삽입으로 처리한다(중복 없이 한 번만)
          applyActions(parseInputEvent('insertText', event.data ?? ''));
          resetHidden();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            if (canConfirm) check();
          }
        }}
        onFocus={() =>
          answerRef.current?.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
          })
        }
        inputMode="text"
        enterKeyHint="done"
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        aria-label="영어 답변 입력"
        tabIndex={-1}
        className="pointer-events-none absolute h-px w-px opacity-0"
      />

      {/* 내 답변 — 단어별 박스. 활성 박스는 주황 테두리+깜빡이, 오답은 흔들림+빨강(커서가 그 단어로), 힌트는 흐리게. 정답이면 초록 물결. */}
      <div
        ref={answerRef}
        className="mt-7 flex flex-wrap justify-center gap-2 pb-2"
      >
        {answer.map((word, w) => {
          const value = typed[w] ?? '';
          const isWrong = wrongNow[w];
          const isFocus = !correct && w === focus;
          const hintLevel = wrongCount[w];
          const wordOffset = lengths
            .slice(0, w)
            .reduce((sum, len) => sum + len, 0);
          const atEnd = isFocus && value.length === word.length;
          return (
            <button
              key={`${w}-${isWrong ? shakeNonce : 'ok'}`}
              type="button"
              // 버튼 탭이 숨은 입력 포커스를 뺏지 않게 — 대신 우리가 직접 focusBox로 키보드를 띄운다
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => focusBox(w)}
              disabled={correct}
              className={`inline-flex items-center gap-0.5 rounded-xl border-2 px-2.5 py-1.5 transition-colors duration-200 ${
                isWrong ? 'animate-shake' : ''
              } ${
                correct
                  ? 'border-success/60 bg-success/5'
                  : isWrong
                    ? 'border-destructive bg-destructive/5'
                    : isFocus
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
              }`}
            >
              {Array.from({ length: word.length }).map((_, i) => {
                const char = value[i];
                const showHint =
                  !char && (hintLevel >= 2 || (hintLevel === 1 && i === 0));
                const caretHere = isFocus && i === value.length;
                const delay = `${(wordOffset + i) * 45}ms`;
                return (
                  <span
                    key={i}
                    style={
                      correct
                        ? { transitionDelay: delay, animationDelay: delay }
                        : undefined
                    }
                    className={`relative flex h-8 w-4 items-center justify-center text-xl font-bold transition-colors duration-200 ${
                      correct
                        ? 'animate-pop text-success'
                        : isWrong
                          ? 'text-destructive'
                          : 'text-foreground'
                    }`}
                  >
                    {char ||
                      (showHint ? (
                        <span className="text-muted-foreground/40">
                          {word[i]}
                        </span>
                      ) : (
                        ''
                      ))}
                    {/* 얇은 세로 막대 커서 — 힌트 글자 위에 겹쳐 깜빡인다 */}
                    {caretHere && !correct && (
                      <span className="absolute inset-0 m-auto h-5 w-0.5 animate-pulse rounded-full bg-primary" />
                    )}
                  </span>
                );
              })}
              {/* 단어를 꽉 채운 채 활성이면(오답 수정 등) 끝에 얇은 커서를 보여준다 */}
              {atEnd && !correct && (
                <span className="h-5 w-0.5 animate-pulse rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {correct && (
        <ReviewSuccess
          expression={targetExpressionText}
          meaning={meaning}
          onFinish={onFinish}
          finishing={finishing}
        />
      )}
    </StepScaffold>
  );
};
