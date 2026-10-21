// useAnswerGuideToggle — 칩·접기로 직접 여닫고, 대기 중 오래 망설이면 저절로 펼치고, 새 질문은 접힌 채 시작하는지 본다
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  answerGuideAutoOpenMs,
  useAnswerGuideToggle,
} from './useAnswerGuideToggle';

interface Props {
  question: string;
  available: boolean;
  waiting: boolean;
}

const onToggled = vi.fn();

const renderToggle = (initial: Props) =>
  renderHook((props: Props) => useAnswerGuideToggle({ ...props, onToggled }), {
    initialProps: initial,
  });

const ready: Props = { question: 'Q1', available: true, waiting: true };

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useAnswerGuideToggle', () => {
  it('칩을 누르면 펼치고 직접 연 것으로 알린다', () => {
    const { result } = renderToggle(ready);

    act(() => result.current.openGuide());

    expect(result.current.open).toBe(true);
    expect(onToggled).toHaveBeenCalledWith(true, 'tap');
  });

  it('접기를 누르면 답변칸으로 돌아간다', () => {
    const { result } = renderToggle(ready);
    act(() => result.current.openGuide());

    act(() => result.current.closeGuide());

    expect(result.current.open).toBe(false);
    expect(onToggled).toHaveBeenLastCalledWith(false, 'tap');
  });

  it('대기 중 망설이는 시간이 지나면 저절로 펼친다', () => {
    const { result } = renderToggle(ready);

    act(() => {
      vi.advanceTimersByTime(answerGuideAutoOpenMs);
    });

    expect(result.current.open).toBe(true);
    expect(onToggled).toHaveBeenCalledWith(true, 'auto');
  });

  it('그 전에 말하기를 시작하면 저절로 펼치지 않는다', () => {
    const { result, rerender } = renderToggle(ready);

    act(() => {
      vi.advanceTimersByTime(answerGuideAutoOpenMs - 1);
    });
    rerender({ ...ready, waiting: false });
    act(() => {
      vi.advanceTimersByTime(answerGuideAutoOpenMs);
    });

    expect(result.current.open).toBe(false);
  });

  it('직접 접은 질문은 다시 기다려도 저절로 펼치지 않는다', () => {
    const { result } = renderToggle(ready);
    act(() => result.current.openGuide());
    act(() => result.current.closeGuide());

    act(() => {
      vi.advanceTimersByTime(answerGuideAutoOpenMs * 2);
    });

    expect(result.current.open).toBe(false);
  });

  it('말하는 중에도 칩으로 펼칠 수 있다', () => {
    const { result } = renderToggle({ ...ready, waiting: false });

    act(() => result.current.openGuide());

    expect(result.current.open).toBe(true);
  });

  it('다음 질문으로 넘어가면 접힌 채 시작한다', () => {
    const { result, rerender } = renderToggle(ready);
    act(() => result.current.openGuide());

    rerender({ ...ready, question: 'Q2', waiting: false });

    expect(result.current.open).toBe(false);
  });

  it('가이드가 없는 질문은 기다려도 펼치지 않는다', () => {
    const { result } = renderToggle({ ...ready, available: false });

    act(() => {
      vi.advanceTimersByTime(answerGuideAutoOpenMs);
    });

    expect(result.current.open).toBe(false);
    expect(onToggled).not.toHaveBeenCalled();
  });

  it('저절로 펼칠 차례를 기다리는 동안엔 곧 열린다고 알린다', () => {
    const { result } = renderToggle(ready);

    expect(result.current.autoPending).toBe(true);
  });

  it('직접 접은 질문은 곧 열린다고 알리지 않는다', () => {
    const { result } = renderToggle(ready);
    act(() => result.current.openGuide());

    act(() => result.current.closeGuide());

    expect(result.current.autoPending).toBe(false);
  });

  it('말하는 중이면 곧 열린다고 알리지 않는다', () => {
    const { result } = renderToggle({ ...ready, waiting: false });

    expect(result.current.autoPending).toBe(false);
  });
});
