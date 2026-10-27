// 발음 교정 카드의 행 라벨 검증 — 원어민/나 행 이름과 듣기 버튼 이름이 화면 언어를 따른다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setTestLocale } from '@/shared/i18n/test-locale';

import type { PronunciationWord } from '../../api/pronunciation';
import type { FeedbackCard } from '../../model/pronunciation-feedback';
import { FeedbackCards } from './FeedbackCards';

afterEach(() => cleanup());

const word: PronunciationWord = {
  order: 1,
  word: 'water',
  status: 'PHONEME_ERROR',
  nativeDisplay: 'WAW-ter',
  userDisplay: 'WAH-ter',
  errorTargetSpan: 'WAW',
  errorUserSpan: 'WAH',
  coachingText: null,
  nativeWordAudioUrl: 'https://cdn.example/water.mp3',
  startTimeMs: 0,
  endTimeMs: 400,
  syllables: null,
  stressIndex: null,
  userStressIndex: null,
};

const cards: FeedbackCard[] = [
  {
    kind: 'phoneme',
    word,
    native: [{ text: 'WAW-ter', error: false }],
    user: [{ text: 'WAH-ter', error: false }],
  },
];

const renderCards = () =>
  render(
    <FeedbackCards
      cards={cards}
      disabled={false}
      playingId={null}
      onPlayNative={vi.fn()}
      onPlayMine={vi.fn()}
    />,
  );

describe('FeedbackCards', () => {
  it('원어민 행과 내 행을 나눠 각자 듣기 버튼을 둔다', () => {
    renderCards();

    expect(screen.getByText('원어민')).toBeInTheDocument();
    expect(screen.getByText('나')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '원어민 발음 듣기' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '나 발음 듣기' }),
    ).toBeInTheDocument();
  });

  it('일본어 화면에서는 お手本과 自分으로 행을 나눈다', () => {
    setTestLocale('ja');

    renderCards();

    expect(screen.getByText('お手本')).toBeInTheDocument();
    expect(screen.getByText('自分')).toBeInTheDocument();
  });
});
