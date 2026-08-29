'use client';

// 단어별 판정 칩 — 퀴즈 단어 칩과 같은 3D 스타일에 판정 색만 얹는다.
// 오류 단어 칩은 눌러서 해당 피드백 카드로 이동한다
import type { PronunciationWord } from '../../api/pronunciation';

interface WordChipsProps {
  words: PronunciationWord[];
  // 오류 단어 칩을 눌렀을 때 — 없으면(통과 화면) 전부 정적 칩
  onSelectWord?: (order: number) => void;
}

const CHIP_BASE =
  'inline-flex min-w-[44px] items-center justify-center rounded-xl px-3.5 py-2 text-base font-bold';

// 게이지가 차오른 뒤(≈0.5s) 칩이 순서대로 톡톡 떠오른다
const chipDelay = (index: number) => ({
  animationDelay: `${500 + index * 50}ms`,
});

export const WordChips = ({ words, onSelectWord }: WordChipsProps) => (
  <div className="flex flex-wrap justify-center gap-x-2 gap-y-2.5">
    {words.map((word, index) => {
      const isError = word.status !== 'CORRECT';
      // 이동할 교정 카드가 실제로 있는 오류만 버튼으로 — 음절 없는 강세 오류는 카드가 접혀 정적 칩으로 남긴다
      const hasCard =
        word.status === 'PHONEME_ERROR' ||
        (word.status === 'STRESS_ERROR' && Boolean(word.syllables?.length));
      // 눌리는 것만 눌리게 보이게 — 오류 단어만 3D 돌출(퀴즈 칩 문법), 정상 단어는 납작하게 가라앉힌다
      if (hasCard && onSelectWord) {
        return (
          <button
            key={word.order}
            onClick={() => onSelectWord(word.order)}
            style={chipDelay(index)}
            className={`${CHIP_BASE} animate-fade-up border border-border bg-card text-destructive shadow-[0_3px_0_var(--border)] transition-[translate,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none`}
          >
            {word.word}
          </button>
        );
      }
      return (
        <span
          key={word.order}
          style={chipDelay(index)}
          className={`${CHIP_BASE} animate-fade-up ${
            isError
              ? 'border border-border bg-card text-destructive'
              : 'bg-secondary/60 text-success'
          }`}
        >
          {word.word}
        </span>
      );
    })}
  </div>
);
