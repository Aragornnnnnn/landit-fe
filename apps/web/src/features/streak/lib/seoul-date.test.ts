// Asia/Seoul 날짜 도구의 계약 테스트 — 기기 타임존이 개입하면 하루가 밀린다
import { afterEach, describe, expect, it, vi } from 'vitest';

import { monthOf, todayInSeoul } from './seoul-date';

afterEach(() => {
  vi.useRealTimers();
});

describe('todayInSeoul', () => {
  it('UTC로는 아직 어제여도 서울 기준 날짜를 준다', () => {
    // given — UTC 8월 3일 16시, 서울은 이미 8월 4일 새벽 1시
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-03T16:00:00Z'));

    // when + then — 서울 기준으로 하루 넘어간 날짜가 나온다
    expect(todayInSeoul()).toBe('2026-08-04');
  });

  it('서울 자정 전이면 같은 날에 머문다', () => {
    // given — UTC 8월 3일 14시, 서울은 8월 3일 밤 11시
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-03T14:00:00Z'));

    // when + then — 아직 날짜가 안 넘어갔다
    expect(todayInSeoul()).toBe('2026-08-03');
  });
});

describe('monthOf', () => {
  it('날짜에서 연·월을 숫자로 뽑는다', () => {
    // when — 한 자리 월도 숫자로 떨어져야 한다
    expect(monthOf('2026-08-03')).toEqual({ year: 2026, month: 8 });
  });
});
