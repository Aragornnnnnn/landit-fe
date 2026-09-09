// 분석 대기 화면 — 결과가 쓸 만하면 그 결과로, 실패·근거 부족·시간 초과면 빈손으로 한 번만 넘긴다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { UsableAssessment } from '@/features/feedback/model/level-assessment';

import { AnalyzingScreen } from './AnalyzingScreen';

const mocks = vi.hoisted(() => ({
  query: {
    outcome: 'pending' as 'pending' | 'ready' | 'unavailable',
    levelAssessment: null as unknown,
  },
}));
vi.mock('@/features/feedback/model/useLevelAssessmentQuery', () => ({
  useLevelAssessmentQuery: () => mocks.query,
}));
vi.mock('@/features/expression/ui/pronunciation/AnalyzingLandy', () => ({
  AnalyzingLandy: () => <span data-testid="landy" />,
}));

const domain = (score: number) => ({ score, confidence: 0.9 });
const usable: UsableAssessment = {
  situationPerformance: domain(4),
  grammar: domain(3),
  vocabulary: domain(3),
  discourse: domain(3),
  interactionPragmatics: domain(3),
  assessedScore: 3.2,
  assessedLevel: 3,
  sufficientEvidence: true,
  source: 'MODEL',
  changeType: 'INITIALIZED',
  previousLevel: null,
  currentLevel: 3,
  displayLevel: 3,
  details: null,
  assessmentVersion: 'v1',
};

beforeEach(() => {
  vi.useFakeTimers();
  mocks.query = { outcome: 'pending', levelAssessment: null };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('AnalyzingScreen', () => {
  it('기다리는 동안은 제목과 래디만 보여주고 넘기지 않는다', () => {
    const onDone = vi.fn();
    render(<AnalyzingScreen sessionId={1} onDone={onDone} />);

    expect(screen.getByText(/레벨을 분석하고 있어요/)).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('쓸 만한 결과가 오면 그 결과로 넘긴다', () => {
    mocks.query = { outcome: 'ready', levelAssessment: usable };
    const onDone = vi.fn();
    render(<AnalyzingScreen sessionId={1} onDone={onDone} />);

    expect(onDone).toHaveBeenCalledWith(usable);
  });

  it('결과는 왔지만 근거가 부족하면 빈손으로 넘긴다 — 기본값 레벨을 확정처럼 보여주지 않는다', () => {
    mocks.query = {
      outcome: 'ready',
      levelAssessment: { ...usable, sufficientEvidence: false },
    };
    const onDone = vi.fn();
    render(<AnalyzingScreen sessionId={1} onDone={onDone} />);

    expect(onDone).toHaveBeenCalledWith(null);
  });

  it('평가가 실패했거나 예약되지 않았으면 빈손으로 넘긴다', () => {
    mocks.query = { outcome: 'unavailable', levelAssessment: null };
    const onDone = vi.fn();
    render(<AnalyzingScreen sessionId={1} onDone={onDone} />);

    expect(onDone).toHaveBeenCalledWith(null);
  });

  it('제한 시간이 지나면 빈손으로 넘긴다 — 이 뒤가 페이월이라 오래 붙잡지 않는다', () => {
    const onDone = vi.fn();
    render(<AnalyzingScreen sessionId={1} onDone={onDone} />);

    vi.advanceTimersByTime(20_000);

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith(null);
  });
});
