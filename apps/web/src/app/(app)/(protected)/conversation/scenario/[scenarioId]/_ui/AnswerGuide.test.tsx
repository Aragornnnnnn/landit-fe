// AnswerGuide — 예시 카드가 열리면 포커스가 카드 안으로 들어가는지 본다 (칩이 카드로 바뀌며 사라져 포커스를 잃지 않게)
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AnswerGuideSlot } from './AnswerGuide';

const guide = {
  content: "I'm a student. I like watching movies.",
  translatedContent: '난 학생이야. 영화 보는 걸 좋아해.',
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('AnswerGuideSlot', () => {
  it('예시 카드가 다 펼쳐지면 접기 버튼으로 포커스가 간다', () => {
    vi.useFakeTimers();
    render(
      <AnswerGuideSlot guide={guide} open onClose={vi.fn()}>
        <div />
      </AnswerGuideSlot>,
    );

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByRole('button', { name: /접기/ })).toHaveFocus();
  });

  it('펼쳐지는 첫 순간에는 포커스를 옮기지 않는다 — 그 프레임에 화면 계산을 더 얹지 않게', () => {
    vi.useFakeTimers();
    render(
      <AnswerGuideSlot guide={guide} open onClose={vi.fn()}>
        <div />
      </AnswerGuideSlot>,
    );

    expect(screen.getByRole('button', { name: /접기/ })).not.toHaveFocus();
  });

  it('예시 카드는 이름 있는 영역으로 읽힌다', () => {
    render(
      <AnswerGuideSlot guide={guide} open onClose={vi.fn()}>
        <div />
      </AnswerGuideSlot>,
    );

    expect(
      screen.getByRole('region', { name: '답변 예시' }),
    ).toBeInTheDocument();
  });
});
