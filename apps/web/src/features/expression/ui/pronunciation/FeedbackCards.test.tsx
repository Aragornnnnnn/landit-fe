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

  it('판정 오류 카드에도 연습이 필요하다는 배지를 단다', () => {
    renderCards();

    expect(screen.getByText('연습이 필요해요')).toBeInTheDocument();
  });

  describe('100점 미만 카드', () => {
    const lowScoreCard = (
      overrides: Partial<PronunciationWord>,
      user = 'sim·uh·ler',
    ): FeedbackCard => ({
      kind: 'lowScore',
      word: { ...word, status: 'CORRECT', userDisplay: null, ...overrides },
      native: [{ text: 'sim·uh·ler', error: false }],
      user,
    });

    const renderCard = (card: FeedbackCard) =>
      render(
        <FeedbackCards
          cards={[card]}
          disabled={false}
          playingId={null}
          onPlayNative={vi.fn()}
          onPlayMine={vi.fn()}
        />,
      );

    it('노란 단어면 조금 어색하다는 배지를 단다', () => {
      renderCard(lowScoreCard({ score: 80 }));

      expect(screen.getByText('조금 어색해요')).toBeInTheDocument();
    });

    it('빨간 단어면 연습이 필요하다는 배지를 단다', () => {
      renderCard(lowScoreCard({ score: 40 }));

      expect(screen.getByText('연습이 필요해요')).toBeInTheDocument();
    });

    it('초록 단어면 배지를 달지 않는다', () => {
      renderCard(lowScoreCard({ score: 90 }));

      expect(screen.queryByText('조금 어색해요')).not.toBeInTheDocument();
      expect(screen.queryByText('연습이 필요해요')).not.toBeInTheDocument();
    });

    it('내 행에 들린 단어를 보여준다', () => {
      renderCard(lowScoreCard({ score: 40 }, 'choose'));

      expect(screen.getByText('choose')).toBeInTheDocument();
    });

    it('내 녹음 구간이 없으면 내 행의 듣기 버튼을 숨긴다', () => {
      renderCard(
        lowScoreCard({ score: 80, startTimeMs: null, endTimeMs: null }),
      );

      expect(
        screen.queryByRole('button', { name: '나 발음 듣기' }),
      ).not.toBeInTheDocument();
    });
  });
});
