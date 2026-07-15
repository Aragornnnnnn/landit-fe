// FeedbackSurvey — 점수 선택 게이팅, 제출 배선, 실패 폴백 동작 검증
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { submitNps } from '../api/nps';
import { FeedbackSurvey } from './FeedbackSurvey';

// 애니메이션 런타임은 경계 — framer-motion이 중첩 react 복사본을 물어 렌더러와 인스턴스가 갈리므로
// 동작 검증에는 애니메이션 속성을 걷어낸 평범한 DOM으로 대체한다
vi.mock('motion/react', async () => {
  const { createElement, Fragment } = await import('react');
  const MOTION_PROPS = new Set([
    'initial',
    'animate',
    'exit',
    'transition',
    'whileTap',
    'whileHover',
    'whileInView',
    'layout',
    'variants',
  ]);
  const motion = new Proxy(
    {},
    {
      get:
        (_target, tag: string) =>
        ({ children, ...props }: Record<string, unknown>) =>
          createElement(
            tag,
            Object.fromEntries(
              Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key)),
            ),
            children as React.ReactNode,
          ),
    },
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      createElement(Fragment, null, children),
  };
});

vi.mock('../api/nps', () => ({ submitNps: vi.fn() }));

const submitNpsMock = vi.mocked(submitNps);

describe('FeedbackSurvey', () => {
  beforeEach(() => {
    submitNpsMock.mockResolvedValue(undefined);
  });

  afterEach(cleanup);

  it('점수를 고르기 전엔 제출이 비활성이라 눌러도 제출되지 않는다', () => {
    render(<FeedbackSurvey onDone={vi.fn()} />);

    fireEvent.click(
      screen.getByRole('button', { name: /만족하는지 알려줘요/ }),
    );

    expect(submitNpsMock).not.toHaveBeenCalled();
  });

  it('점수를 고르고 제출하면 그 점수로 submitNps를 부르고 감사 화면을 보여준다', async () => {
    render(<FeedbackSurvey onDone={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '만족도 4점' }));
    fireEvent.click(screen.getByRole('button', { name: /제출할게요/ }));

    await waitFor(() => expect(submitNpsMock).toHaveBeenCalledWith(4, ''));
    expect(screen.getByText(/소중한 의견 고마워요/)).toBeInTheDocument();
  });

  it('제출이 실패해도 감사 화면으로 넘어간다', async () => {
    submitNpsMock.mockRejectedValue(new Error('network'));
    render(<FeedbackSurvey onDone={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '만족도 2점' }));
    fireEvent.click(screen.getByRole('button', { name: /제출할게요/ }));

    await waitFor(() =>
      expect(screen.getByText(/소중한 의견 고마워요/)).toBeInTheDocument(),
    );
  });
});
