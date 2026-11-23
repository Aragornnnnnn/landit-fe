// 표정 애니메이션 키 보간 규칙 — 키 사이를 어떻게 잇는지(멈춤·직선·곡선)와 층 전환 섞기를 검증한다
import { describe, expect, it } from 'vitest';

import {
  cubicBezier,
  mixFrames,
  valueAt,
  type Key,
} from './expression-timeline';

describe('valueAt', () => {
  it('멈춤 키 다음 구간에서는 다음 키 직전까지 값을 그대로 유지한다', () => {
    // Given
    const keys: Key[] = [
      [0, 0, 'hold', null],
      [10, 1, 'hold', null],
    ];

    // When
    const value = valueAt(keys, 9);

    // Then
    expect(value).toBe(0);
  });

  it('직선 키 사이는 진행한 만큼 비례해서 값이 바뀐다', () => {
    // Given
    const keys: Key[] = [
      [0, 0, 'linear', null],
      [10, 10, 'hold', null],
    ];

    // When
    const value = valueAt(keys, 4);

    // Then
    expect(value).toBeCloseTo(4);
  });

  it('곡선 키 사이는 이징 곡선을 따라 값이 바뀐다', () => {
    // Given — 천천히 출발하는 곡선이라 앞쪽 25%에서는 직선보다 덜 나아간다
    const keys: Key[] = [
      [0, 0, 'cubic', [0.42, 0, 1, 1]],
      [100, 100, 'hold', null],
    ];

    // When
    const value = valueAt(keys, 25);

    // Then
    expect(value).toBeLessThan(25);
  });

  it('마지막 키를 지나면 마지막 값을 유지한다', () => {
    // Given
    const keys: Key[] = [
      [0, 0, 'linear', null],
      [10, 5, 'hold', null],
    ];

    // When
    const value = valueAt(keys, 40);

    // Then
    expect(value).toBe(5);
  });
});

describe('cubicBezier', () => {
  it('구간 밖의 진행도는 양 끝으로 잡는다', () => {
    // Given
    const ease = cubicBezier([0.42, 0, 0.58, 1]);

    // When
    const values = [ease(-0.5), ease(1.5)];

    // Then
    expect(values).toEqual([0, 1]);
  });
});

describe('mixFrames', () => {
  it('한쪽에만 있는 값은 기본값과 섞는다 — 새 표정에 없는 값이 튀지 않고 원래 자리로 돌아온다', () => {
    // Given — 이전 표정에만 하트가 떠 있었다
    const from = new Map([['heart|opacity', 1]]);
    const to = new Map<string, number>();
    const base = new Map([['heart|opacity', 0]]);

    // When
    const mixed = mixFrames(from, to, base, 0.25);

    // Then
    expect(mixed.get('heart|opacity')).toBeCloseTo(0.75);
  });
});
