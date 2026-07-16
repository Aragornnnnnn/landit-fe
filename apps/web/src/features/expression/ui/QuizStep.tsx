'use client';

// 듀오링고식 단어 선택 퀴즈 — 뱅크에서 단어를 순서대로 골라 문장을 완성하고 판정, 결과는 하단 슬라이드업 시트로 띄운다
import { useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { haptic } from '@/shared/haptics';
import { Button } from '@/shared/ui/Button';

import type { SentenceQuiz } from '../model/sentenceQuiz';
import {
  chipsFromWords,
  isWordsCorrect,
  type WordChip,
} from '../model/wordBank';
import { QuizPrompt } from './QuizPrompt';
import { ResultSheet } from './ResultSheet';
import { StepScaffold } from './StepScaffold';

interface QuizStepProps {
  quiz: SentenceQuiz;
  // 계측 속성용 — 어떤 표현의 퀴즈인지
  expressionId: number;
  onBack: () => void;
  leftAction?: 'back' | 'close';
  // 정답·오답 모두 결과 시트의 CTA로 다음 스텝으로 이어진다 (퀴즈→설명, 복습→완료)
  onNext: () => void;
  nextLabel?: string;
  finishing?: boolean;
}

type Checked = 'idle' | 'wrong' | 'correct';

// 단어 칩 — 공용 Button과 같은 3D 눌림 효과 (흰 배경 + 회색 엣지 그림자)
// min-w로 짧은 단어("I")가 원형으로 뭉치지 않게 최소 폭을 준다
const CHIP_STYLE =
  'inline-flex min-w-[44px] items-center justify-center rounded-xl border border-border bg-card px-3.5 py-2.5 text-base font-semibold text-foreground ' +
  'shadow-[0_3px_0_var(--border)] transition-[translate,box-shadow] duration-75 ' +
  'active:translate-y-[3px] active:shadow-none';

export const QuizStep = ({
  quiz,
  expressionId,
  onBack,
  leftAction,
  onNext,
  nextLabel = '표현 배우러 갈게요',
  finishing = false,
}: QuizStepProps) => {
  const answer = quiz.answerWords;

  // 뱅크는 BE가 섞어준 shuffledWords 그대로. 선택은 칩 id의 순서 배열로 관리한다(중복 단어 안전).
  const [bank] = useState<WordChip[]>(() => chipsFromWords(quiz.shuffledWords));
  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState<Checked>('idle');
  // 힌트는 일회성 — 누르면 지금 자리의 힌트가 켜지고, 단어를 올리거나 내리면 꺼진다. 버튼은 계속 남는다
  const [hintActive, setHintActive] = useState(false);
  // 제출 계측용 — 이 퀴즈에서 힌트를 한 번이라도 썼는가
  const [hintUsed, setHintUsed] = useState(false);

  const usedIds = new Set(selected);
  const full = selected.length === answer.length;
  const wordOf = (id: number) =>
    bank.find((chip) => chip.id === id)?.word ?? '';

  const showHint = () => {
    track(EVENTS.HINT_USED, { source: 'quiz', level: 1 });
    setHintActive(true);
    setHintUsed(true);
  };

  const pick = (chip: WordChip) => {
    if (checked !== 'idle' || usedIds.has(chip.id) || full) return;
    track(EVENTS.QUIZ_WORD_PICKED, {
      expression_id: expressionId,
      picked_count: selected.length + 1,
    });
    setHintActive(false);
    setSelected((current) => [...current, chip.id]);
  };

  const removeAt = (index: number) => {
    if (checked !== 'idle') return;
    track(EVENTS.QUIZ_WORD_REMOVED, {
      expression_id: expressionId,
      picked_count: selected.length - 1,
    });
    setHintActive(false);
    setSelected((current) => current.filter((_, i) => i !== index));
  };

  const check = () => {
    const tone = isWordsCorrect(selected.map(wordOf), answer)
      ? 'correct'
      : 'wrong';
    track(EVENTS.QUIZ_ANSWER_SUBMITTED, {
      expression_id: expressionId,
      is_correct: tone === 'correct',
      hint_level: hintUsed ? 1 : 0,
    });
    haptic(tone === 'correct' ? 'success' : 'error');
    setChecked(tone);
  };

  // 게이지는 단어를 고르는 동안엔 비워두고, 판정을 마쳐야 절반이 찬다(나머지 절반은 이후 스텝 몫).
  const progress = checked === 'idle' ? 0 : 0.5;

  // 힌트 활성 중엔 이미 올린 칩의 정오도 알려준다 — 자리와 다른 칩은 빨갛게 표시
  const misplacedAt = (index: number) =>
    hintActive &&
    checked === 'idle' &&
    wordOf(selected[index]).toLowerCase() !== answer[index]?.toLowerCase();
  // 다음에 고를(또는 첫 오배치 자리의) 정답 단어와 일치하는 미사용 칩을 하이라이트한다
  const firstMisplaced = selected.findIndex((_, index) => misplacedAt(index));
  const hintTargetIndex =
    firstMisplaced >= 0 ? firstMisplaced : selected.length;
  const nextWord = answer[hintTargetIndex];
  const hintChipId =
    hintActive && checked === 'idle' && nextWord
      ? bank.find((chip) => !usedIds.has(chip.id) && chip.word === nextWord)?.id
      : undefined;

  return (
    <StepScaffold
      progress={progress}
      onBack={onBack}
      leftAction={leftAction}
      footer={
        checked === 'idle' ? (
          <Button disabled={!full} onClick={check}>
            확인할게요
          </Button>
        ) : undefined
      }
    >
      <QuizPrompt writingSentence={quiz} />

      {/* 내 답변 — 중앙 밑줄 2줄, 고른 칩이 줄 위에 올라간다 */}
      <div
        className="mt-6 flex min-h-[124px] flex-wrap content-start gap-x-2"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent, transparent 60px, var(--border) 60px, var(--border) 62px)',
        }}
      >
        {selected.map((id, index) => (
          <span key={index} className="flex h-[62px] items-center">
            <button
              onClick={() => removeAt(index)}
              className={
                misplacedAt(index)
                  ? `${CHIP_STYLE} border-destructive! text-destructive`
                  : CHIP_STYLE
              }
            >
              {wordOf(id)}
            </button>
          </span>
        ))}
      </div>

      {/* 힌트 — 항상 떠 있고, 누를 때마다 지금 자리의 힌트(다음 단어·오배치)를 일회성으로 보여준다.
          단어를 올리거나 내리면 꺼져서, 막힐 때마다 다시 눌러 쓴다. 정답 공개는 없다 */}
      {checked === 'idle' && (
        <div className="flex min-h-9 items-center justify-center pt-2">
          <button
            type="button"
            onClick={showHint}
            disabled={hintActive}
            className="text-sm font-semibold text-muted-foreground underline underline-offset-4 transition-colors active:text-foreground disabled:opacity-60"
          >
            <span className="tossface mr-1">💡</span>힌트 보기
          </button>
        </div>
      )}

      {/* ── 아래: 단어뱅크 ── 가운데 정렬, 선택한 칩 자리는 글자 없는 회색 슬랩으로 남는다(듀오링고식) */}
      <div className="flex flex-wrap justify-center gap-2 pt-6 pb-4">
        {bank.map((chip) => {
          const used = usedIds.has(chip.id);
          return (
            <button
              key={chip.id}
              onClick={() => pick(chip)}
              disabled={used || checked !== 'idle'}
              className={
                used
                  ? 'inline-flex min-w-[44px] items-center justify-center rounded-xl border border-transparent bg-secondary px-3.5 py-2.5 text-base font-semibold text-transparent'
                  : chip.id === hintChipId
                    ? `${CHIP_STYLE} border-primary! text-primary`
                    : CHIP_STYLE
              }
            >
              {chip.word}
            </button>
          );
        })}
      </div>

      {checked !== 'idle' && (
        <ResultSheet
          tone={checked}
          answer={quiz.writingSentenceText}
          onNext={onNext}
          nextLabel={nextLabel}
          finishing={finishing}
        />
      )}
    </StepScaffold>
  );
};
