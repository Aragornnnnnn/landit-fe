// 날짜 스트립의 월 패널 계약 검증 — 월 응답 전에는 주 폴백이 아니라 스켈레톤을 그린다
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { closeTopSheet } from '@/shared/ui/bottom-sheet-back';

import type { ScenarioCalendarResponse } from '../api/calendar';
import { useScenarioCalendarQuery } from '../model/useScenarioCalendarQuery';
import { CalendarStrip } from './CalendarStrip';

vi.mock('../model/useScenarioCalendarQuery', () => ({
  useScenarioCalendarQuery: vi.fn(),
}));

const mockQuery = vi.mocked(useScenarioCalendarQuery);

const day = (date: string) => ({
  date,
  completed: false,
  scenarioId: null,
  thumbnailUrl: null,
});

// 8월 첫 주(일~토)와 8월 한 달 응답
const WEEK: ScenarioCalendarResponse = {
  type: 'WEEK',
  date: '2026-08-02',
  label: '2026년 8월 1주차',
  today: '2026-08-06',
  startedAt: '2026-08-01',
  days: [
    '2026-08-02',
    '2026-08-03',
    '2026-08-04',
    '2026-08-05',
    '2026-08-06',
    '2026-08-07',
    '2026-08-08',
  ].map(day),
};

const MONTH: ScenarioCalendarResponse = {
  type: 'MONTH',
  date: '2026-08-01',
  label: '2026년 8월',
  today: '2026-08-06',
  startedAt: '2026-08-01',
  days: Array.from({ length: 31 }, (_, index) =>
    day(`2026-08-${String(index + 1).padStart(2, '0')}`),
  ),
};

const givenCalendars = (month: ScenarioCalendarResponse | null) =>
  mockQuery.mockImplementation((type) => ({
    calendar: type === 'WEEK' ? WEEK : month,
  }));

afterEach(() => cleanup());

describe('CalendarStrip 월 패널', () => {
  it('월 응답이 오기 전에는 스켈레톤을 그린다 — 주 7일을 달 격자에 그리지 않는다', () => {
    // Given 월 조회가 아직 응답하지 않은 상태에서
    givenCalendars(null);
    render(<CalendarStrip selected={null} onSelect={vi.fn()} />);

    // When 월 토글을 누르면
    fireEvent.click(screen.getByRole('button', { name: '월' }));

    // Then 달 패널에는 스켈레톤이 뜬다
    expect(
      screen.getByRole('status', { name: '달력 불러오는 중' }),
    ).toBeInTheDocument();
    // Then 주 스트립의 7일이 달 격자에 겹쳐 그려지지 않는다 — 날짜 칸은 주 스트립 7개가 전부다
    expect(screen.getAllByRole('button', { name: /8월 \d+일/ })).toHaveLength(
      7,
    );
  });

  it('월 응답이 오면 그 달 전체를 그린다', () => {
    // Given 월 조회가 이미 응답한 상태에서
    givenCalendars(MONTH);
    render(<CalendarStrip selected={null} onSelect={vi.fn()} />);

    // When 월 토글을 누르면
    fireEvent.click(screen.getByRole('button', { name: '월' }));

    // Then 스켈레톤 없이 말일까지 그린다 (주 스트립 7개 + 달 31개)
    expect(
      screen.queryByRole('status', { name: '달력 불러오는 중' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '8월 31일' }),
    ).toBeInTheDocument();
  });
});

describe('CalendarStrip 월 패널 — 뒤로가기·스크롤', () => {
  it('펼친 동안 네이티브 뒤로가기를 누르면 주 보기로 접힌다', () => {
    // Given 월 패널이 펼쳐진 상태에서
    givenCalendars(MONTH);
    render(<CalendarStrip selected={null} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '월' }));

    // When 네이티브 뒤로가기가 오면
    let handled = false;
    act(() => {
      handled = closeTopSheet();
    });

    // Then 화면 전환 대신 패널이 접힌다
    expect(handled).toBe(true);
    expect(screen.getByRole('button', { name: '주' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('펼친 동안 배경 스크롤을 막고, 접히면 되돌린다', () => {
    givenCalendars(MONTH);
    render(<CalendarStrip selected={null} onSelect={vi.fn()} />);

    // When 월 패널을 펼치면
    fireEvent.click(screen.getByRole('button', { name: '월' }));
    // Then 배경 스크롤이 막힌다
    expect(document.body.style.overflow).toBe('hidden');

    // When 다시 접으면
    fireEvent.click(screen.getByRole('button', { name: '주' }));
    // Then 스크롤 잠금이 풀린다
    expect(document.body.style.overflow).toBe('');
  });
});
