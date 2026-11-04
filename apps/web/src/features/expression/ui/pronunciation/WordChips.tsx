'use client';

// 단어별 판정 칩 — 퀴즈 단어 칩과 같은 3D 스타일에 판정 색만 얹는다.
// 색은 단어 점수를 따르고, 교정 카드가 있는 단어 칩은 눌러서 해당 카드로 이동한다
import { useTranslations } from 'next-intl';

import type { PronunciationWord } from '../../api/pronunciation';
import { toFeedbackCards } from '../../model/pronunciation-feedback';
import { wordTone } from '../../model/pronunciation-score';
import { WORD_TONE_TEXT } from './word-tone-text';

interface WordChipsProps {
  words: PronunciationWord[];
  // 카드가 있는 단어 칩을 눌렀을 때 — 없으면(100점 화면) 전부 정적 칩
  onSelectWord?: (order: number) => void;
}

const CHIP_BASE =
  'inline-flex min-w-[44px] items-center justify-center rounded-xl px-3.5 py-2 text-base font-bold';

// 게이지가 차오른 뒤(≈0.5s) 칩이 순서대로 톡톡 떠오른다
const chipDelay = (index: number) => ({
  animationDelay: `${500 + index * 50}ms`,
});

export const WordChips = ({ words, onSelectWord }: WordChipsProps) => {
  const t = useTranslations('expression.wordChips');
  return (
    <div className="flex flex-wrap justify-center gap-x-2 gap-y-2.5">
      {words.map((word, index) => {
        const isError = word.status !== 'CORRECT';
        const tone = wordTone(word);
        // 이동할 교정 카드가 실제로 있는 단어만 버튼으로
        const hasCard = toFeedbackCards([word]).length > 0;
        // 눌리는 것만 눌리게 보이게 — 카드가 있는 단어만 3D 돌출(퀴즈 칩 문법), 나머지는 납작하게 가라앉힌다
        if (hasCard && onSelectWord) {
          return (
            <button
              key={word.order}
              onClick={() => onSelectWord(word.order)}
              aria-label={t('jumpLabel', { word: word.word })}
              style={chipDelay(index)}
              className={`${CHIP_BASE} animate-fade-up border border-border bg-card ${WORD_TONE_TEXT[tone]} shadow-[0_3px_0_var(--border)] transition-[translate,box-shadow] duration-75 active:translate-y-[3px] active:shadow-none`}
            >
              {word.word}
            </button>
          );
        }
        return (
          <span
            key={word.order}
            aria-label={
              isError ? t('needsFixLabel', { word: word.word }) : undefined
            }
            style={chipDelay(index)}
            className={`${CHIP_BASE} animate-fade-up ${WORD_TONE_TEXT[tone]} ${
              tone === 'green'
                ? 'bg-secondary/60'
                : 'border border-border bg-card'
            }`}
          >
            {word.word}
          </span>
        );
      })}
    </div>
  );
};
