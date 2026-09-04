// 추가 예문 스텝 검증 — 예문 카드의 표현 구간 강조, 이미지 유무, 보고 있는 예문의 노출 계측
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';

import type { PracticeSentence } from '../../api/practice';
import { ExamplesStep } from './ExamplesStep';

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

afterEach(cleanup);

const example = (
  sentenceText: string,
  imageUrl: string | null = null,
): PracticeSentence => ({
  sentenceText,
  highlightingPart: 'blew my mind',
  sentenceTranslation: '특수효과가 끝내줬어.',
  practiceQuestion: 'How was the movie?',
  practiceQuestionTranslation: '영화 어땠어?',
  imageUrl,
});

const renderStep = (examples: PracticeSentence[]) =>
  render(
    <ExamplesStep
      expressionId={7}
      examples={examples}
      title="끝내주게 놀랍다"
      progress={0.7}
      onBack={vi.fn()}
      onNext={vi.fn()}
    />,
  );

describe('ExamplesStep', () => {
  it('예문 안의 표현 구간만 따로 강조한다', () => {
    renderStep([example('The special effects blew my mind.')]);

    expect(screen.getByText('blew my mind')).toHaveAttribute('data-highlight');
    expect(screen.getByText('How was the movie?')).toBeInTheDocument();
    expect(screen.getByText('특수효과가 끝내줬어.')).toBeInTheDocument();
  });

  it('표현 구간을 못 찾으면 문장을 그대로 보여준다', () => {
    renderStep([example('The special effects were amazing.')]);

    expect(
      screen.getByText('The special effects were amazing.'),
    ).toBeInTheDocument();
  });

  it('이미지가 있는 예문만 카드 위에 이미지를 띄운다', () => {
    const { container } = renderStep([
      example('A blew my mind.', 'https://cdn/a.webp'),
      example('B blew my mind.'),
    ]);

    // 장식 이미지(alt 없음)라 역할로는 못 찾는다 — 예문 이미지 주소만 센다
    const exampleImages = [...container.querySelectorAll('img')].filter((img) =>
      img.getAttribute('src')?.startsWith('https://cdn/'),
    );
    expect(exampleImages).toHaveLength(1);
  });

  it('보고 있는 예문(첫 장)을 노출로 기록한다', () => {
    renderStep([example('A blew my mind.'), example('B blew my mind.')]);

    expect(track).toHaveBeenCalledWith('Example Sentence Viewed', {
      expression_id: 7,
      sentence_index: 0,
    });
    expect(track).toHaveBeenCalledTimes(1);
  });
});
