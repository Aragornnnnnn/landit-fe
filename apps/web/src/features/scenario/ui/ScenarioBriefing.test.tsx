// 대화 진입 브리핑 검증 — 이미지·제목·설명을 보여주고, 시간이 지나면 onDone으로 진입을 넘긴다
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { closeTopSheet } from '@/shared/ui/bottom-sheet-back';

import type { Scenario } from '../lib/to-scenario';
import { briefingHoldMs, ScenarioBriefing } from './ScenarioBriefing';

// framer-motion은 모노레포 다중 react 사본 문제로 렌더가 깨진다 — 순수 DOM 대역으로 치환한다
vi.mock('motion/react', () => import('@/shared/motion/test-double'));

const scenario: Scenario = {
  scenarioId: 1,
  starRating: null,
  scenarioTitle: '카페에서 주문하기',
  briefing: '바리스타에게 원하는 음료를 주문해 보세요.',
  conversationGoal: '음료 주문 완료',
  difficulty: 'EASY',
  firstSpeaker: 'AI',
  thumbnailUrl: 'https://example.com/cafe.webp',
  completed: false,
  locked: false,
  openingPreview: null,
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('ScenarioBriefing', () => {
  it('이미지·제목·설명을 보여주고, 시간이 되기 전엔 onDone을 부르지 않는다', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();

    render(
      <ScenarioBriefing
        scenario={scenario}
        onDone={onDone}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText('카페에서 주문하기')).toBeInTheDocument();
    expect(
      screen.getByText('바리스타에게 원하는 음료를 주문해 보세요.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: '카페에서 주문하기' }),
    ).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('브리핑 시간이 지나면 onDone을 한 번 부른다', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(
      <ScenarioBriefing
        scenario={scenario}
        onDone={onDone}
        onCancel={vi.fn()}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(briefingHoldMs + 50);
    });

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('떠 있는 동안 뒤로가기를 누르면 앱 종료 대신 진입을 무른다', () => {
    vi.useFakeTimers();
    const onCancel = vi.fn();
    render(
      <ScenarioBriefing
        scenario={scenario}
        onDone={vi.fn()}
        onCancel={onCancel}
      />,
    );

    expect(closeTopSheet()).toBe(true);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('썸네일이 없으면 이미지 대신 기본 아이콘을 보여준다', () => {
    vi.useFakeTimers();

    render(
      <ScenarioBriefing
        scenario={{ ...scenario, thumbnailUrl: null }}
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('💬')).toBeInTheDocument();
  });
});
