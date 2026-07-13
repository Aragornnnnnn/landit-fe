'use client';

// 듀오링고식 단어 선택 퀴즈 — 뱅크에서 단어를 순서대로 골라 문장을 완성하고 판정, 결과는 하단 슬라이드업 시트로 띄운다
import { useState } from 'react';

import { Button } from '@/shared/ui/Button';

import type { ExpressionPractice } from '../api/practice';
import {
  chipsFromWords,
  isWordsCorrect,
  type WordChip,
} from '../model/wordBank';
import { QuizPrompt } from './QuizPrompt';
import { ResultSheet } from './ResultSheet';
import { StepScaffold } from './StepScaffold';

interface QuizStepProps {
  practice: ExpressionPractice;
  onBack: () => void;
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
  practice,
  onBack,
  onNext,
  nextLabel = '표현 배우러 갈게요',
  finishing = false,
}: QuizStepProps) => {
  const { writingSentence } = practice;
  const answer = writingSentence.answerWords;

  // 뱅크는 BE가 섞어준 shuffledWords 그대로. 선택은 칩 id의 순서 배열로 관리한다(중복 단어 안전).
  const [bank] = useState<WordChip[]>(() =>
    chipsFromWords(writingSentence.shuffledWords),
  );
  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState<Checked>('idle');

  const usedIds = new Set(selected);
  const full = selected.length === answer.length;
  const wordOf = (id: number) =>
    bank.find((chip) => chip.id === id)?.word ?? '';

  const pick = (chip: WordChip) => {
    if (checked !== 'idle' || usedIds.has(chip.id) || full) return;
    setSelected((current) => [...current, chip.id]);
  };

  const removeAt = (index: number) => {
    if (checked !== 'idle') return;
    setSelected((current) => current.filter((_, i) => i !== index));
  };

  const check = () =>
    setChecked(
      isWordsCorrect(selected.map(wordOf), answer) ? 'correct' : 'wrong',
    );

  // 판정 전엔 채운 만큼(전체의 절반까지) 진행. 판정되면 절반 고정(나머지 절반은 이후 스텝 몫).
  const progress =
    checked === 'idle' ? 0.5 * (selected.length / answer.length) : 0.5;

  return (
    <StepScaffold
      progress={progress}
      onBack={onBack}
      footer={
        checked === 'idle' ? (
          <Button disabled={!full} onClick={check}>
            확인할게요
          </Button>
        ) : undefined
      }
    >
      <QuizPrompt writingSentence={writingSentence} />

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
            <button onClick={() => removeAt(index)} className={CHIP_STYLE}>
              {wordOf(id)}
            </button>
          </span>
        ))}
      </div>

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
          answer={writingSentence.writingSentenceText}
          onNext={onNext}
          nextLabel={nextLabel}
          finishing={finishing}
        />
      )}
    </StepScaffold>
  );
};
