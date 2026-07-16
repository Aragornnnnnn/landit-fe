'use client';

// 복습 영작(D안 ⑤) — 답변 박스를 누르면 네이티브 키보드가 뜨고, 그 입력이 기존 단어별 모델로 흘러간다.
// 답변은 단어별 박스로 그리고(자동 넘김·조기 이동·박스 클릭 수정 그대로), 오답은 흔들림+빨강, 정답이면 화려한 획득 연출.
import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

import { haptic } from '@/shared/haptics';
import { useKeyboardInset } from '@/shared/lib/useKeyboardInset';
import { CheckIcon } from '@/shared/ui/Icons';

import {
  advance,
  appendLetter,
  applyComposition,
  backspace,
  emptyState,
  firstWrong,
  focusWord,
  gradePartial,
  gradeWords,
  isComplete,
  parseInputEvent,
  type InputState,
  type ReviewInputAction,
} from '../model/reviewInput';
import type { SentenceQuiz } from '../model/sentenceQuiz';
import { HintButton } from './HintButton';
import { QuizPrompt } from './QuizPrompt';
import { ReviewSuccess } from './ReviewSuccess';
import { StepScaffold } from './StepScaffold';

interface ReviewInputStepProps {
  quiz: SentenceQuiz;
  // 완료 연출 카드에 띄울 표현·뜻
  targetExpressionText: string;
  meaning: string;
  // 예문(설명 스텝)을 보러 나갔다 돌아와도 쓰던 입력을 이어가도록, 부모가 draft를 보관한다
  initialState?: InputState;
  onStateChange?: (state: InputState) => void;
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
  initialState,
  onStateChange,
  onBack,
  onFinish,
  finishing,
}: ReviewInputStepProps) => {
  const answer = quiz.answerWords;
  const lengths = answer.map((word) => word.length);

  // draft가 있고 단어 수가 맞으면 이어서 시작한다 (문제가 바뀌었으면 새로)
  const [state, setState] = useState(() =>
    initialState && initialState.typed.length === answer.length
      ? initialState
      : emptyState(answer.length),
  );
  const [correct, setCorrect] = useState(false);
  const [wrongCount, setWrongCount] = useState<number[]>(() =>
    answer.map(() => 0),
  );
  const [wrongNow, setWrongNow] = useState<boolean[]>(() =>
    answer.map(() => false),
  );
  const [shakeNonce, setShakeNonce] = useState(0);
  // 힌트 단계 — 0 없음, 1 모든 단어 첫 글자, 2 정답 전체 글자를 흐리게 공개
  const [hintStep, setHintStep] = useState(0);

  const { typed, focus } = state;
  const canConfirm = isComplete(state, lengths);

  // 네이티브 키보드용 숨은 입력 — 여길 focus시켜 OS 키보드를 띄우고, 키 입력을 기존 모델로 흘려보낸다
  const hiddenRef = useRef<HTMLInputElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  // 조합입력(IME) 중엔 input 이벤트를 무시하고, compositionupdate/end에서 조합 문자열을 흘려보낸다.
  const composingRef = useRef(false);
  // 이미 반영한 조합 문자열 — 다음 조합 문자열과의 차이만 반영해 라이브로 채운다.
  const composedRef = useRef('');
  // 박스가 꽉 차 버려진 조합 글자 수 — IME 버퍼와 모델의 어긋남 보정(applyComposition 참고)
  const droppedRef = useRef(0);
  // 조합 이벤트가 렌더 사이에 연달아 와도 최신 상태에서 계산하도록 미러를 든다
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const keyboardInset = useKeyboardInset();

  // 부모에 draft를 보고한다 — 예문 보러 나갔다 와도 입력이 유지되게
  useEffect(() => {
    onStateChange?.(state);
    // onStateChange는 인라인 함수라 매 렌더 바뀐다 — state 변화에만 보고하면 충분하다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

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

  // 키보드가 올라와 뷰포트가 줄면 답변 박스를 다시 가운데로 맞춘다 —
  // 포커스 시점엔 아직 키보드 전이라 스크롤이 어긋날 수 있어, 인셋이 확정된 뒤 한 번 더 정렬한다.
  // 스크롤이 인셋을 다시 바꿔 정렬이 반복되지 않도록, 인셋이 0→양수로 뜨는 순간에만 실행한다.
  const prevInsetRef = useRef(0);
  useEffect(() => {
    const appeared = prevInsetRef.current === 0 && keyboardInset > 0;
    prevInsetRef.current = keyboardInset;
    if (appeared && !correct) {
      answerRef.current?.scrollIntoView({ block: 'center' });
    }
  }, [keyboardInset, correct]);

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
      haptic('success');
      setCorrect(true);
      return;
    }
    haptic('error');
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

  // 조합 문자열 변화를 모델에 반영한다 — 버려진 글자(dropped)까지 추적해 IME 버퍼와 어긋나지 않게
  const applyCompositionChange = (next: string) => {
    if (correct) return;
    const result = applyComposition(
      stateRef.current,
      composedRef.current,
      next,
      lengths,
      droppedRef.current,
    );
    stateRef.current = result.state;
    droppedRef.current = result.dropped;
    composedRef.current = next;
    setState(result.state);
    clearWrong();
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
          composedRef.current = '';
          droppedRef.current = 0;
        }}
        onCompositionUpdate={(event) => {
          // 조합 중에도 이전 조합 대비 차이만 반영해, 타이핑하는 즉시 박스가 채워진다
          applyCompositionChange(event.data ?? '');
        }}
        onCompositionEnd={(event) => {
          // 남은 차이만 마저 반영하고(중복 없이) 조합 상태를 닫는다
          applyCompositionChange(event.data ?? '');
          composingRef.current = false;
          composedRef.current = '';
          droppedRef.current = 0;
          resetHidden();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            if (canConfirm) check();
          }
        }}
        // 키보드가 뜨면 답변 박스를 가운데로 올려, 위의 풀 문장(한글)과 입력 박스가 함께 보이게 한다
        onFocus={() =>
          answerRef.current?.scrollIntoView({
            block: 'center',
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
          // 오답 누적 힌트와 힌트 버튼 단계 중 더 강한 쪽을 쓴다
          const hintLevel = Math.max(wrongCount[w], hintStep);
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

      {/* 힌트 — 한 번 누르면 모든 단어 첫 글자, 한 번 더 누르면 정답 전체를 흐리게 공개.
          누르는 순간 지금까지 친 입력의 정오도 함께 알려준다(틀린 단어 빨강+흔들림) */}
      {!correct && (
        <div className="flex justify-center pt-3">
          <HintButton
            step={hintStep}
            onAdvance={() => {
              const ok = gradePartial(typed, answer);
              if (ok.some((isOk) => !isOk)) {
                setWrongNow(ok.map((isOk) => !isOk));
                setShakeNonce((n) => n + 1);
              }
              setHintStep((step) => step + 1);
            }}
            keepFocus
          />
        </div>
      )}

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
