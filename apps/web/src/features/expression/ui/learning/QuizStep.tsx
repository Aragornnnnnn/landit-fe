'use client';

// 듀오링고식 단어 선택 퀴즈 — 뱅크에서 단어를 순서대로 골라 문장을 완성하고 판정, 결과는 하단 슬라이드업 시트로 띄운다
// QUIZ·REVIEW 두 스텝이 공용으로 쓴다(진행바 구간·칩 선택 복원·정답 연출은 props로 스텝별로 갈라진다)
import { useEffect, useState } from 'react';
import { EVENTS, type QuizStepKind } from '@landit/analytics';
import { motion, useReducedMotion } from 'motion/react';

import type { Partner } from '@/features/conversation/model/character-look';
import { track } from '@/shared/analytics';
import { haptic } from '@/shared/haptics';
import { EASE_STANDARD } from '@/shared/motion';
import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';

import type { SentenceQuiz } from '../../model/sentence-quiz';
import { useChipReorder } from '../../model/useChipReorder';
import {
  chipsFromWords,
  isWordsCorrect,
  type WordChip,
} from '../../model/word-bank';
import { QuizPrompt } from '../common/QuizPrompt';
import { StepScaffold } from '../common/StepScaffold';
import { ResultSheet } from './ResultSheet';

// 제출 이벤트는 스텝마다 다르다 — 복습을 퀴즈로 세지 않게
const SUBMIT_EVENT = {
  quiz: EVENTS.QUIZ_ANSWER_SUBMITTED,
  review: EVENTS.REVIEW_ANSWER_SUBMITTED,
} as const;

interface QuizStepProps {
  // 어느 스텝의 퀴즈인지 — 제출·힌트 이벤트가 이 값으로 갈린다. 빠뜨리면 오귀속이라 기본값을 두지 않는다
  step: QuizStepKind;
  quiz: SentenceQuiz;
  // 질문을 건네는 상대 — 플로우가 뽑아 넘긴다(퀴즈·복습이 같은 얼굴)
  partner: Partner;
  // 계측 속성용 — 어떤 표현의 퀴즈인지
  expressionId: number;
  onBack: () => void;
  leftAction?: 'back' | 'close';
  // 정답·오답 모두 결과 시트의 CTA로 다음 스텝으로 이어진다 (퀴즈→설명, 복습→완료)
  onNext: () => void;
  nextLabel?: string;
  finishing?: boolean;
  // 상단 진행바를 [idle일 때, 판정 후] 두 값으로 — 기본은 퀴즈 스텝 구간(0→0.5)
  progressRange?: [number, number];
  // 설명 스텝을 보러 나갔다 돌아와도 고른 칩을 복원한다(복습에서 사용, 뱅크 순서가 고정이라 칩 id로 안전하게 복원됨)
  initialSelected?: number[];
  onSelectedChange?: (selected: number[]) => void;
  // 정답일 때 결과 시트 자리에 대신 띄울 연출(없으면 기본 ResultSheet) — 복습의 획득 연출(콘페티+카드)에 쓴다.
  // 오답은 이 슬롯을 타지 않고 항상 기본 ResultSheet를 보여준다. onNext/finishing은 호출부가 이미 쥐고 있으니 다시 넘기지 않는다.
  correctSlot?: () => React.ReactNode;
}

type Checked = 'idle' | 'wrong' | 'correct';

// 단어 칩 — 공용 Button과 같은 3D 눌림 효과 (흰 배경 + 회색 엣지 그림자)
// min-w로 짧은 단어("I")가 원형으로 뭉치지 않게 최소 폭을 준다
const CHIP_BASE =
  'inline-flex min-w-[44px] items-center justify-center rounded-xl border border-border bg-card px-3.5 py-2.5 text-base font-semibold text-foreground';
// 빈 자리 — 뱅크에서 고른 칩 자리와 끌고 나간 자리에 같은 회색 슬랩을 쓴다
const CHIP_SLAB = 'rounded-xl bg-secondary';
const CHIP_STYLE =
  `${CHIP_BASE} shadow-[0_3px_0_var(--border)] transition-[translate,box-shadow] duration-75 ` +
  'active:translate-y-[3px] active:shadow-none';
// 밀려나는 칩이 새 자리로 미끄러지는 속도
const SLOT_SHIFT = { duration: 0.18, ease: EASE_STANDARD } as const;
// 답변 줄에 올린 칩 — 끌 수 있어야 하므로 이 칩 위에서 시작한 터치는 화면 스크롤로 넘기지 않는다
const CHIP_PLACED = `${CHIP_STYLE} touch-none`;
// 끌고 있는 칩 — 눌림 효과 대신 살짝 떠서 손가락을 따라온다
const CHIP_DRAGGING = `${CHIP_BASE} relative z-10 touch-none scale-105 shadow-[0_8px_16px_rgba(0,0,0,0.18)]`;

export const QuizStep = ({
  step,
  quiz,
  partner,
  expressionId,
  onBack,
  leftAction,
  onNext,
  nextLabel = '표현 배우러 갈게요',
  finishing = false,
  progressRange = [0, 0.5],
  initialSelected,
  onSelectedChange,
  correctSlot,
}: QuizStepProps) => {
  const answer = quiz.answerWords;
  const reduced = useReducedMotion() ?? false;

  // 뱅크는 BE가 섞어준 shuffledWords 그대로. 선택은 칩 id의 순서 배열로 관리한다(중복 단어 안전).
  const [bank] = useState<WordChip[]>(() => chipsFromWords(quiz.shuffledWords));
  const [selected, setSelected] = useState<number[]>(
    () => initialSelected ?? [],
  );
  const [checked, setChecked] = useState<Checked>('idle');
  // 힌트는 일회성 — 누르면 지금 자리의 힌트가 켜지고, 단어를 올리거나 내리면 꺼진다. 버튼은 계속 남는다
  const [hintActive, setHintActive] = useState(false);
  // 제출 계측용 — 이 퀴즈에서 힌트를 한 번이라도 썼는가
  const [hintUsed, setHintUsed] = useState(false);

  // 부모에 선택을 보고한다 — 설명 스텝을 다녀와도 고른 칩이 유지되게(복습에서 사용)
  useEffect(() => {
    onSelectedChange?.(selected);
    // onSelectedChange는 인라인 함수라 매 렌더 바뀐다 — selected 변화에만 보고하면 충분하다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const usedIds = new Set(selected);
  const full = selected.length === answer.length;
  const wordOf = (id: number) =>
    bank.find((chip) => chip.id === id)?.word ?? '';

  const showHint = () => {
    track(EVENTS.HINT_USED, { source: step, level: 1 });
    setHintActive(true);
    setHintUsed(true);
  };

  // 순서를 바꾸는 것도 단어를 놓는 일이다 — 올리거나 내릴 때처럼 힌트가 꺼진다
  const reorderChips = (next: number[]) => {
    setHintActive(false);
    setSelected(next);
  };

  const { drag, rowRef, bindChip, pressChip, swallowDragClick } =
    useChipReorder(selected, reorderChips);

  const pick = (chip: WordChip) => {
    // 끌고 있는 중엔 뱅크를 받지 않는다 — 드래그가 들고 있는 순서를 덮어쓰기 때문
    if (checked !== 'idle' || usedIds.has(chip.id) || full || drag) return;
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

  // 판정을 마친 뒤엔 답변 줄을 건드리지 않는다 — pick·removeAt과 같은 자리에서 막는다
  const dragChip = (id: number) => (event: React.PointerEvent) => {
    if (checked !== 'idle') return;
    pressChip(id)(event);
  };

  // 칩을 빼는 탭 — 끌고 나서 따라오는 클릭은 순서만 바꾸고 끝낸다
  const tapChip = (index: number) => {
    if (swallowDragClick()) return;
    removeAt(index);
  };

  const check = () => {
    const tone = isWordsCorrect(selected.map(wordOf), answer)
      ? 'correct'
      : 'wrong';
    track(SUBMIT_EVENT[step], {
      expression_id: expressionId,
      is_correct: tone === 'correct',
      hint_level: hintUsed ? 1 : 0,
    });
    haptic(tone === 'correct' ? 'success' : 'error');
    setChecked(tone);
  };

  // 게이지는 단어를 고르는 동안엔 구간 시작값, 판정을 마쳐야 구간 끝값이 찬다.
  const progress = checked === 'idle' ? progressRange[0] : progressRange[1];
  // 정답 연출 슬롯이 뜨는 순간(표현학습 마지막 완료)엔 게이지도 성공 색으로 맞춘다
  const progressTone =
    checked === 'correct' && correctSlot ? 'success' : 'primary';

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
      progressTone={progressTone}
      onBack={onBack}
      leftAction={leftAction}
      footer={
        checked === 'idle' ? (
          <Button size="md" disabled={selected.length === 0} onClick={check}>
            확인할게요
          </Button>
        ) : undefined
      }
    >
      <QuizPrompt writingSentence={quiz} partner={partner} />

      {/* 내 답변 — 중앙 밑줄 2줄, 고른 칩이 줄 위에 올라간다 */}
      <div
        ref={rowRef}
        className="relative mt-6 flex min-h-[124px] flex-wrap content-start gap-x-2"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent, transparent 60px, var(--border) 60px, var(--border) 62px)',
        }}
      >
        {selected.map((id, index) => {
          const dragging = drag?.id === id;
          return (
            <motion.span
              key={id}
              ref={bindChip(id)}
              layout={!dragging}
              layoutDependency={index}
              transition={reduced ? { duration: 0 } : SLOT_SHIFT}
              className="relative flex h-[62px] items-center"
            >
              {/* 끌고 나간 자리는 비워둔다 */}
              {dragging && (
                <span className={`absolute inset-x-0 inset-y-2 ${CHIP_SLAB}`} />
              )}
              <button
                onPointerDown={dragChip(id)}
                onClick={() => tapChip(index)}
                style={
                  dragging
                    ? { translate: `${drag.dx}px ${drag.dy}px` }
                    : undefined
                }
                className={`${dragging ? CHIP_DRAGGING : CHIP_PLACED} ${
                  misplacedAt(index)
                    ? 'border-destructive! text-destructive'
                    : ''
                }`}
              >
                {wordOf(id)}
              </button>
            </motion.span>
          );
        })}
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
            <Emoji className="mr-1">💡</Emoji>힌트 보기
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
                  ? `inline-flex min-w-[44px] items-center justify-center border border-transparent px-3.5 py-2.5 text-base font-semibold text-transparent ${CHIP_SLAB}`
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

      {checked !== 'idle' &&
        (checked === 'correct' && correctSlot ? (
          correctSlot()
        ) : (
          <ResultSheet
            tone={checked}
            answer={quiz.writingSentenceText}
            onNext={onNext}
            nextLabel={nextLabel}
            finishing={finishing}
          />
        ))}
    </StepScaffold>
  );
};
