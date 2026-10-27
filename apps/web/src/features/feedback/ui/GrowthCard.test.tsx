// 실수 기억 카드 — 지난 날짜를 화면 언어로 쓴다
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { setTestLocale } from '@/shared/i18n/test-locale';

import type { ScenarioGrowthCard } from '../api/session-feedback';
import { GrowthCard } from './GrowthCard';

const growth: ScenarioGrowthCard = {
  pattern: 'PAST_TENSE',
  patternLabel: '과거형',
  succeeded: true,
  previousDate: '2026-09-28',
  previousSentence: 'I go there yesterday.',
  previousWrongSpan: 'go',
  currentSentence: 'I went there yesterday.',
  currentSpan: 'went',
};

describe('GrowthCard', () => {
  it('지난 날짜를 「9월 28일」로 쓴다', () => {
    render(<GrowthCard growth={growth} />);

    expect(screen.getByText('9월 28일')).toBeInTheDocument();
  });

  it('일본어 화면에서는 지난 날짜를 「9月28日」로 쓴다', () => {
    setTestLocale('ja');

    render(<GrowthCard growth={growth} />);

    expect(screen.getByText('9月28日')).toBeInTheDocument();
  });
});
