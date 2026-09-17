// 레벨 결과 화면 — 이름·레벨·영역 점수를 보여주고 노출을 남기며, CTA가 다음으로 넘긴다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { UsableAssessment } from '@/features/feedback/model/level-assessment';

import { LevelResultScreen } from './LevelResultScreen';

const mocks = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('next/image', () => ({ default: () => <span /> }));
vi.mock('motion/react', () => import('@/shared/motion/test-double'));
// zustand 훅은 자기 밑 react 복사본을 잡아 렌더러와 어긋난다 — 선택자만 흉내 낸다
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 1, nickname: '준서' } }),
}));

const domain = (score: number) => ({ score, confidence: 0.9 });
const assessment: UsableAssessment = {
  situationPerformance: domain(4.1),
  grammar: domain(2.7),
  vocabulary: domain(3.55),
  discourse: domain(3.3),
  interactionPragmatics: domain(2.9),
  assessedScore: 3.4,
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

afterEach(() => cleanup());

describe('LevelResultScreen', () => {
  it('이름과 레벨, 영역별 점수를 보여주고 노출을 남긴다', () => {
    render(
      <LevelResultScreen
        scenarioId={7}
        assessment={assessment}
        onContinue={vi.fn()}
      />,
    );

    expect(screen.getByText('준서님의 레벨은')).toBeInTheDocument();
    expect(screen.getByText('견습 마법사')).toBeInTheDocument();
    expect(screen.getByText('Lv.3')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /문법 54점/ })).toBeInTheDocument();
    expect(screen.getByText('54')).toBeInTheDocument();
    expect(mocks.track).toHaveBeenCalledWith('Level Result Viewed', {
      scenario_id: 7,
      level: 3,
      change_type: 'INITIALIZED',
    });
  });

  it('CTA를 누르면 다음으로 넘긴다', () => {
    const onContinue = vi.fn();
    render(
      <LevelResultScreen
        scenarioId={7}
        assessment={assessment}
        onContinue={onContinue}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: '나에게 맞는 학습지 받기' }),
    );

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
