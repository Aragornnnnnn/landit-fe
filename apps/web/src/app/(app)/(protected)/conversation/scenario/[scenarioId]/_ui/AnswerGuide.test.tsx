// AnswerGuide — 「예시 볼래요」 알약이 예시 카드로 펼쳐지고 접히는지, 펼친 뒤 포커스가 카드 안으로 들어가는지 본다
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AnswerGuide } from './AnswerGuide';

const guide = {
  content: "I'm a student. I like watching movies.",
  translatedContent: '난 학생이야. 영화 보는 걸 좋아해.',
};

const renderGuide = (open: boolean) => {
  const onOpen = vi.fn();
  const onClose = vi.fn();
  render(
    <AnswerGuide
      guide={guide}
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      hintVisible={false}
    />,
  );
  return { onOpen, onClose };
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('AnswerGuide', () => {
  it('접혀 있으면 「예시 볼래요」를 누를 때 펼친다', () => {
    const { onOpen } = renderGuide(false);

    fireEvent.click(screen.getByRole('button', { name: '예시 볼래요' }));

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(guide.content)).not.toBeInTheDocument();
  });

  it('펼치면 예시 문장과 뜻을 보이고, 접기를 누르면 접는다', () => {
    const { onClose } = renderGuide(true);

    expect(screen.getByText(guide.content)).toBeInTheDocument();
    expect(screen.getByText(guide.translatedContent)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /접기/ }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('예시 카드가 다 펼쳐지면 접기 버튼으로 포커스가 간다', () => {
    vi.useFakeTimers();
    renderGuide(true);

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByRole('button', { name: /접기/ })).toHaveFocus();
  });

  it('펼쳐지는 첫 순간에는 포커스를 옮기지 않는다 — 그 프레임에 화면 계산을 더 얹지 않게', () => {
    vi.useFakeTimers();
    renderGuide(true);

    expect(screen.getByRole('button', { name: /접기/ })).not.toHaveFocus();
  });

  it('예시 카드는 이름 있는 영역으로 읽힌다', () => {
    renderGuide(true);

    expect(
      screen.getByRole('region', { name: '답변 예시' }),
    ).toBeInTheDocument();
  });
});
