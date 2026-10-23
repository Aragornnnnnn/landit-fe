// AnswerGuide — 예시 카드가 열리면 포커스가 카드 안으로 들어가는지 본다 (칩이 카드로 바뀌며 사라져 포커스를 잃지 않게)
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AnswerGuideSlot } from './AnswerGuide';

const guide = {
  content: "I'm a student. I like watching movies.",
  translatedContent: '난 학생이야. 영화 보는 걸 좋아해.',
};

afterEach(cleanup);

describe('AnswerGuideSlot', () => {
  it('예시 카드가 열리면 접기 버튼으로 포커스가 간다', () => {
    render(
      <AnswerGuideSlot guide={guide} open onClose={vi.fn()}>
        <div />
      </AnswerGuideSlot>,
    );

    expect(screen.getByRole('button', { name: /접기/ })).toHaveFocus();
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
