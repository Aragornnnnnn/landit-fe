'use client';

// 복습 영작(D안 ⑤) — OS 키보드 대신 커스텀 영어 자판으로 입력. 답변은 단어별 박스로 그리고, 활성 칸은 깜빡이며 유도한다.
// 단어가 정답 글자 수만큼 차면 자동으로 다음 박스로. 오답은 단어 단위 흔들림+빨강이며, 그 단어로 커서가 가서 바로 고칠 수 있다. 정답이면 화려한 획득 연출.
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

import { haptic } from '@/shared/haptics';

import {
  advance,
  appendLetter,
  backspace,
  emptyState,
  firstWrong,
  focusWord,
  gradeWords,
  isComplete,
} from '../model/reviewInput';
import type { SentenceQuiz } from '../model/sentenceQuiz';
import { Keyboard } from './Keyboard';
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

  return (
    <StepScaffold
      progress={1}
      onBack={onBack}
      footerBleed
      footer={
        correct ? undefined : (
          <Keyboard
            onKey={onKey}
            onSpace={onSpace}
            onBackspace={onBackspace}
            onConfirm={check}
            canConfirm={canConfirm}
          />
        )
      }
    >
      <QuizPrompt
        writingSentence={quiz}
        instruction="질문에 대한 대답을 입력해보세요"
      />

      {/* 내 답변 — 단어별 박스. 활성 박스는 주황 테두리+깜빡이, 오답은 흔들림+빨강(커서가 그 단어로), 힌트는 흐리게. 정답이면 초록 물결. */}
      <div className="mt-7 flex flex-wrap justify-center gap-2 pb-2">
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
              onClick={() => !correct && setState((s) => focusWord(s, w))}
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
