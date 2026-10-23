// useAnswerGuideToggle — 칩·접기로 여닫고, 새 질문은 접힌 채 시작하고, 유도 힌트는 한 번만 보이는지 본다
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAnswerGuideToggle } from './useAnswerGuideToggle';

interface Props {
  question: string;
  available: boolean;
  hintable: boolean;
}

const onToggled = vi.fn();

const renderToggle = (initial: Props) =>
  renderHook((props: Props) => useAnswerGuideToggle({ ...props, onToggled }), {
    initialProps: initial,
  });

// 첫 질문을 다 듣고 기다리는 중 — 힌트를 띄울 수 있는 때
const ready: Props = { question: 'Q1', available: true, hintable: true };

describe('useAnswerGuideToggle', () => {
  it('칩을 누르면 펼치고, 힌트 없이 연 것으로 알린다', () => {
    const { result } = renderToggle({ ...ready, hintable: false });

    act(() => result.current.openGuide());

    expect(result.current.open).toBe(true);
    expect(onToggled).toHaveBeenCalledWith(true, false);
  });

  it('힌트가 떠 있을 때 칩을 누르면 힌트를 보고 연 것으로 알린다', () => {
    const { result } = renderToggle(ready);

    act(() => result.current.openGuide());

    expect(onToggled).toHaveBeenCalledWith(true, true);
  });

  it('접기를 누르면 답변칸으로 돌아간다', () => {
    const { result } = renderToggle(ready);
    act(() => result.current.openGuide());

    act(() => result.current.closeGuide());

    expect(result.current.open).toBe(false);
    expect(onToggled).toHaveBeenLastCalledWith(false, false);
  });

  it('다음 질문으로 넘어가면 접힌 채 시작한다', () => {
    const { result, rerender } = renderToggle(ready);
    act(() => result.current.openGuide());

    rerender({ ...ready, question: 'Q2', hintable: false });

    expect(result.current.open).toBe(false);
  });

  it('키보드로 바꿔 접히면 계측 없이 접는다', () => {
    const { result } = renderToggle(ready);
    act(() => result.current.openGuide());
    onToggled.mockClear();

    act(() => result.current.collapseGuide());

    expect(result.current.open).toBe(false);
    expect(onToggled).not.toHaveBeenCalled();
  });

  it('힌트를 띄울 수 있는 때면 힌트가 보인다', () => {
    const { result } = renderToggle(ready);

    expect(result.current.hintVisible).toBe(true);
  });

  it('가이드가 없는 질문은 힌트도 없다', () => {
    const { result } = renderToggle({ ...ready, available: false });

    expect(result.current.hintVisible).toBe(false);
  });

  it('칩을 눌러 펼치면 힌트가 사라지고, 접어도 다시 뜨지 않는다', () => {
    const { result } = renderToggle(ready);
    act(() => result.current.openGuide());

    act(() => result.current.closeGuide());

    expect(result.current.hintVisible).toBe(false);
  });

  it('말하기를 눌러 힌트를 치우면, 다시 대기로 돌아와도 뜨지 않는다', () => {
    const { result, rerender } = renderToggle(ready);
    act(() => result.current.dismissHint());
    rerender({ ...ready, hintable: false });

    rerender(ready);

    expect(result.current.hintVisible).toBe(false);
  });

  it('키보드로 바꾸면 힌트도 치운다', () => {
    const { result } = renderToggle(ready);

    act(() => result.current.collapseGuide());

    expect(result.current.hintVisible).toBe(false);
  });
});
