// useSatisfactionSheet — 홈 탭에 돌아왔을 때 어느 시트를 하나만 띄울지 고르는 규칙 검증
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  consumeAllPending,
  markExpressionCompleted,
  markTalkCompleted,
  recordSatisfactionAnswer,
} from '@/features/satisfaction/model/prompt-record';

import { useSatisfactionSheet } from './useSatisfactionSheet';

// 좋았다고 답한 뒤(시트가 차례를 소비) 다시 와서 대화를 마친 상태
const cameBackAfterGood = (talk: 'scenario' | 'smalltalk' = 'scenario') => {
  markTalkCompleted(talk);
  recordSatisfactionAnswer(talk, 'good');
  consumeAllPending();
  markTalkCompleted(talk);
};

beforeEach(() => localStorage.clear());

describe('useSatisfactionSheet', () => {
  it('그 대화를 처음 마쳤으면 소감 시트다', () => {
    markTalkCompleted('scenario');

    const { result } = renderHook(() => useSatisfactionSheet('scenario'));

    expect(result.current).toBe('talk');
  });

  it('좋았다고 했던 사람이 또 대화를 마쳤으면 리뷰 요청이다', () => {
    cameBackAfterGood();

    const { result } = renderHook(() => useSatisfactionSheet('scenario'));

    expect(result.current).toBe('review');
  });

  it('스몰톡 탭에서도 리뷰 요청이 뜬다 — 대화 종류를 가리지 않는다', () => {
    cameBackAfterGood('smalltalk');

    const { result } = renderHook(() => useSatisfactionSheet('smalltalk'));

    expect(result.current).toBe('review');
  });

  it('표현 학습을 마치고 돌아와도 리뷰 요청이다', () => {
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'good');
    consumeAllPending();
    markExpressionCompleted();

    const { result } = renderHook(() => useSatisfactionSheet('scenario'));

    expect(result.current).toBe('review');
  });

  it('소감을 먼저 묻는다 — 첫 스몰톡이면 리뷰 조건이 돼도 스몰톡 소감이다', () => {
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'good');
    consumeAllPending();
    markTalkCompleted('smalltalk');

    const { result } = renderHook(() => useSatisfactionSheet('smalltalk'));

    expect(result.current).toBe('talk');
  });

  it('좋았다고 한 적이 없으면 아무 시트도 띄우지 않는다', () => {
    markTalkCompleted('scenario');
    recordSatisfactionAnswer('scenario', 'bad');
    consumeAllPending();
    markTalkCompleted('scenario');

    const { result } = renderHook(() => useSatisfactionSheet('scenario'));

    expect(result.current).toBeNull();
  });

  it('한 번 고른 답은 리렌더돼도 바뀌지 않는다 — 시트가 뜨며 차례가 소비돼도 그대로다', () => {
    cameBackAfterGood();
    const { result, rerender } = renderHook(() =>
      useSatisfactionSheet('scenario'),
    );

    consumeAllPending();
    rerender();

    expect(result.current).toBe('review');
  });
});
