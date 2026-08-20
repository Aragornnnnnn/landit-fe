// QuestionCard — 해석 펼쳐보기의 기본 접힘·토글·질문 전환 계약을 검증한다
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QuestionCard } from './QuestionCard';

afterEach(() => cleanup());

describe('QuestionCard', () => {
  it('발화가 끝나도 해석은 접힌 채로 시작한다', () => {
    // Given 해석이 있는 발화가 끝난 상태에서
    render(
      <QuestionCard
        question="How was your day?"
        translation="오늘 하루 어땠어요?"
        speaking={false}
      />,
    );

    // Then 해석은 아직 보이지 않는다
    expect(screen.queryByText('오늘 하루 어땠어요?')).not.toBeInTheDocument();
  });

  it('해석 보기를 누르면 해석이 펼쳐진다', () => {
    render(
      <QuestionCard
        question="How was your day?"
        translation="오늘 하루 어땠어요?"
        speaking={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '해석 보기' }));

    expect(screen.getByText('오늘 하루 어땠어요?')).toBeInTheDocument();
  });

  it('펼친 해석은 다시 눌러 접는다', async () => {
    // Given 해석을 펼쳐 둔 카드에서
    render(
      <QuestionCard
        question="How was your day?"
        translation="오늘 하루 어땠어요?"
        speaking={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '해석 보기' }));

    fireEvent.click(screen.getByRole('button', { name: '해석 접기' }));

    // 접히는 동안은 화면에 남아 있다 — 접힘 애니메이션이 끝나야 사라진다
    await waitFor(() =>
      expect(screen.queryByText('오늘 하루 어땠어요?')).not.toBeInTheDocument(),
    );
  });

  it('다음 질문으로 넘어가면 해석이 다시 접힌 상태로 시작한다', () => {
    // Given 앞 질문에서 해석을 펼쳐 뒀어도
    const { rerender } = render(
      <QuestionCard
        question="How was your day?"
        translation="오늘 하루 어땠어요?"
        speaking={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '해석 보기' }));

    // When 다음 질문이 오면
    rerender(
      <QuestionCard
        question="What did you eat?"
        translation="뭘 드셨어요?"
        speaking={false}
      />,
    );

    // Then 그 질문의 해석은 접힌 채다
    expect(screen.queryByText('뭘 드셨어요?')).not.toBeInTheDocument();
  });

  it('펼치고 접을 때마다 그 상태를 바깥에 알린다', () => {
    const onTranslationToggled = vi.fn();
    render(
      <QuestionCard
        question="How was your day?"
        translation="오늘 하루 어땠어요?"
        speaking={false}
        onTranslationToggled={onTranslationToggled}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '해석 보기' }));
    fireEvent.click(screen.getByRole('button', { name: '해석 접기' }));

    expect(onTranslationToggled.mock.calls).toEqual([[true], [false]]);
  });

  it('선발화 안내 카드에는 해석 자리를 두지 않는다', () => {
    render(
      <QuestionCard
        question="먼저 인사를 건네보세요"
        translation="Say hello first"
        speaking={false}
        instruction
      />,
    );

    expect(
      screen.queryByRole('button', { name: '해석 보기' }),
    ).not.toBeInTheDocument();
  });
});
