// 단어 칩 검증 — 카드가 있는 단어만 눌러서 이동한다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PronunciationWord } from '../../api/pronunciation';
import { WordChips } from './WordChips';

afterEach(() => cleanup());

const word = (overrides: Partial<PronunciationWord>): PronunciationWord => ({
  order: 1,
  word: 'similar',
  status: 'CORRECT',
  startTimeMs: null,
  endTimeMs: null,
  nativeWordAudioUrl: null,
  nativeDisplay: null,
  userDisplay: null,
  errorTargetSpan: null,
  errorUserSpan: null,
  syllables: null,
  stressIndex: null,
  userStressIndex: null,
  coachingText: null,
  ...overrides,
});

describe('WordChips', () => {
  it('맞음 판정이어도 100점 미만이면 눌러서 카드로 이동한다', () => {
    // given
    const onSelectWord = vi.fn();
    render(
      <WordChips
        words={[word({ order: 3, score: 80 })]}
        onSelectWord={onSelectWord}
      />,
    );

    // when
    fireEvent.click(screen.getByRole('button', { name: /similar/ }));

    // then
    expect(onSelectWord).toHaveBeenCalledWith(3);
  });

  it('100점 단어는 누를 수 없다', () => {
    render(<WordChips words={[word({ score: 100 })]} onSelectWord={vi.fn()} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('이동할 곳을 안 주면 100점 미만이어도 누를 수 없다', () => {
    render(<WordChips words={[word({ score: 80 })]} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
