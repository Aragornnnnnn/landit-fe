// 날짜 스트립의 월 패널 계약 검증 — 월 응답 전에는 주 폴백이 아니라 스켈레톤을 그린다
import { EVENTS } from '@landit/analytics';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';
import { closeTopSheet } from '@/shared/ui/bottom-sheet-back';

import type { ScenarioCalendarResponse } from '../api/calendar';
import { useScenarioCalendarQuery } from '../model/useScenarioCalendarQuery';
import { CalendarStrip } from './CalendarStrip';

vi.mock('../model/useScenarioCalendarQuery', () => ({
  useScenarioCalendarQuery: vi.fn(),
}));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

const mockQuery = vi.mocked(useScenarioCalendarQuery);
const trackMock = vi.mocked(track);

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
    isPlaceholderData: false,
  }));

beforeEach(() => trackMock.mockReset());
afterEach(() => cleanup());

describe('CalendarStrip 월 패널', () => {
  it('월 응답이 오기 전에는 스켈레톤을 그린다 — 주 7일을 달 격자에 그리지 않는다', () => {
    // Given 월 조회가 아직 응답하지 않은 상태에서
    givenCalendars(null);
    render(<CalendarStrip onSelect={vi.fn()} />);

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
    render(<CalendarStrip onSelect={vi.fn()} />);

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
    render(<CalendarStrip onSelect={vi.fn()} />);
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
    render(<CalendarStrip onSelect={vi.fn()} />);

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

// 완료한 5일이 낀 주 — 과거 완료일 탭은 열 수 있는 유일한 과거라 계측 대상이다
const WEEK_WITH_COMPLETED: ScenarioCalendarResponse = {
  ...WEEK,
  days: WEEK.days.map((item) =>
    item.date === '2026-08-05' ? { ...item, completed: true } : item,
  ),
};

const givenCompletedWeek = () =>
  mockQuery.mockImplementation((type) => ({
    calendar: type === 'WEEK' ? WEEK_WITH_COMPLETED : MONTH,
    isPlaceholderData: false,
  }));

describe('CalendarStrip 계측', () => {
  it('완료한 지난 날을 누르면 오늘이 아니라고 기록한다', () => {
    givenCompletedWeek();
    render(<CalendarStrip onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '8월 5일 완료' }));

    expect(trackMock).toHaveBeenCalledWith(EVENTS.CALENDAR_DATE_SELECTED, {
      is_today: false,
    });
  });

  it('오늘 칸을 누르면 오늘이라고 기록한다', () => {
    givenCompletedWeek();
    render(<CalendarStrip onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '8월 6일 오늘' }));

    expect(trackMock).toHaveBeenCalledWith(EVENTS.CALENDAR_DATE_SELECTED, {
      is_today: true,
    });
  });

  it('월로 펼치고 주로 접는 전환을 각각 기록한다', () => {
    givenCalendars(MONTH);
    render(<CalendarStrip onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '월' }));
    expect(trackMock).toHaveBeenCalledWith(EVENTS.CALENDAR_VIEW_SWITCHED, {
      view: 'month',
    });

    fireEvent.click(screen.getByRole('button', { name: '주' }));
    expect(trackMock).toHaveBeenCalledWith(EVENTS.CALENDAR_VIEW_SWITCHED, {
      view: 'week',
    });
  });

  it('네이티브 뒤로가기로 접혀도 주 전환으로 기록한다', () => {
    givenCalendars(MONTH);
    render(<CalendarStrip onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '월' }));

    act(() => {
      closeTopSheet();
    });

    expect(trackMock).toHaveBeenCalledWith(EVENTS.CALENDAR_VIEW_SWITCHED, {
      view: 'week',
    });
  });

  it('이전 주로 넘기면 넘김을 기록한다', () => {
    givenCalendars(MONTH);
    render(<CalendarStrip onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '이전' }));

    expect(trackMock).toHaveBeenCalledWith(EVENTS.CALENDAR_PERIOD_MOVED, {
      direction: 'prev',
      view: 'week',
    });
  });
});

// 20일을 완료한 달 — 주 스트립(2~8일) 밖의 날을 고르는 경우
const MONTH_WITH_COMPLETED: ScenarioCalendarResponse = {
  ...MONTH,
  days: MONTH.days.map((item) =>
    item.date === '2026-08-20' ? { ...item, completed: true } : item,
  ),
};

// 달 격자 — 주 스트립과 같은 이름의 칸이 있어 패널 안으로 좁혀 찾는다
const monthPanel = () =>
  screen.getByRole('button', { name: '8월 31일' }).parentElement!;

describe('CalendarStrip 선택 표시', () => {
  it('URL에 date가 있으면 응답을 기다리지 않고 그 날을 선택해 둔다', () => {
    // Given URL의 date가 8월 5일을 가리키면
    givenCompletedWeek();

    // When 스트립을 그리면
    render(<CalendarStrip date="2026-08-05" onSelect={vi.fn()} />);

    // Then 그 날이 선택돼 있다
    expect(
      screen.getByRole('button', { name: '8월 5일 완료' }),
    ).toHaveAttribute('aria-current', 'date');
  });

  it('URL에 date가 없으면 오늘을 선택해 둔다', () => {
    // Given URL에 date가 없으면
    givenCalendars(MONTH);

    // When 스트립을 그리면
    render(<CalendarStrip onSelect={vi.fn()} />);

    // Then 응답이 준 오늘이 선택돼 있다
    expect(
      screen.getByRole('button', { name: '8월 6일 오늘' }),
    ).toHaveAttribute('aria-current', 'date');
  });

  it('월 패널에서 날을 고르면 그 날을 알리고 패널을 접는다', () => {
    // Given 월 패널이 펼쳐진 상태에서
    givenCalendars(MONTH);
    const onSelect = vi.fn();
    render(<CalendarStrip onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: '월' }));

    // When 달 격자에서 8월 6일(오늘)을 고르면
    fireEvent.click(
      within(monthPanel()).getByRole('button', { name: '8월 6일 오늘' }),
    );

    // Then 오늘을 알리고 주 보기로 접힌다
    expect(onSelect).toHaveBeenCalledWith(null);
    expect(screen.getByRole('button', { name: '주' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('월 패널에서 날을 골라 접힐 때는 주 전환으로 기록하지 않는다 — 사용자가 고른 건 날짜다', () => {
    // Given 월 패널이 펼쳐진 상태에서
    givenCalendars(MONTH_WITH_COMPLETED);
    render(<CalendarStrip onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '월' }));
    trackMock.mockClear();

    // When 날을 골라 패널이 접히면
    fireEvent.click(
      within(monthPanel()).getByRole('button', { name: '8월 20일 완료' }),
    );

    // Then 날짜 선택만 남기고 주 전환은 남기지 않는다
    expect(trackMock).toHaveBeenCalledWith(EVENTS.CALENDAR_DATE_SELECTED, {
      is_today: false,
    });
    expect(trackMock).not.toHaveBeenCalledWith(
      EVENTS.CALENDAR_VIEW_SWITCHED,
      expect.anything(),
    );
  });
});

describe('CalendarStrip 주 로딩', () => {
  it('새 주 응답 전에는 이전 주 대신 스켈레톤을 그린다 — 옮긴 뒤에 엉뚱한 주가 보이지 않게', () => {
    // Given 주 조회가 새 주를 받는 중이라 이전 주를 임시로 들고 있으면
    mockQuery.mockImplementation((type) => ({
      calendar: type === 'WEEK' ? WEEK : MONTH,
      isPlaceholderData: type === 'WEEK',
    }));

    // When 스트립을 그리면
    render(<CalendarStrip date="2026-08-20" onSelect={vi.fn()} />);

    // Then 이전 주의 날짜와 이름표 대신 불러오는 중임을 보인다
    expect(screen.getByRole('status', { name: '주 불러오는 중' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '8월 5일' })).toBeNull();
    expect(screen.queryByText('2026년 8월 1주차')).toBeNull();
  });

  it('새 주 응답이 오면 그 주의 날짜를 그린다', () => {
    // Given 주 조회가 응답을 받았으면
    givenCalendars(MONTH);

    // When 스트립을 그리면
    render(<CalendarStrip onSelect={vi.fn()} />);

    // Then 스켈레톤 없이 날짜와 이름표를 그린다
    expect(screen.queryByRole('status', { name: '주 불러오는 중' })).toBeNull();
    expect(screen.getByText('2026년 8월 1주차')).toBeTruthy();
  });
});

describe('CalendarStrip 창 따라가기', () => {
  const lastWeekQuery = () =>
    mockQuery.mock.calls.filter(([type]) => type === 'WEEK').at(-1)?.[1];

  it('월 패널에서 오늘을 고르면 오늘 창을 날짜 없이 묻는다 — 같은 주를 키 두 개로 받지 않게', () => {
    // Given 월 패널이 펼쳐진 상태에서
    givenCalendars(MONTH);
    render(<CalendarStrip onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '월' }));

    // When 달 격자에서 오늘을 고르면
    fireEvent.click(
      within(monthPanel()).getByRole('button', { name: '8월 6일 오늘' }),
    );

    // Then 주 조회는 날짜 없는 오늘 창이다
    expect(lastWeekQuery()).toBeUndefined();
  });

  it('월 패널에서 다른 주의 날을 고르면 URL이 따라오기 전에 주 스트립을 그 주로 옮긴다', () => {
    // Given 20일을 완료한 달이 펼쳐진 상태에서
    givenCalendars(MONTH_WITH_COMPLETED);
    render(<CalendarStrip onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '월' }));

    // When 20일을 고르면 (URL은 아직 그대로)
    fireEvent.click(
      within(monthPanel()).getByRole('button', { name: '8월 20일 완료' }),
    );

    // Then 주 조회가 오늘 주로 돌아가지 않고 20일이 든 주를 묻는다
    expect(lastWeekQuery()).toBe('2026-08-20');
  });

  it('화살표로 다른 주를 보던 중 URL의 date가 바뀌면 그 주로 돌아간다', () => {
    // Given 이전 주로 넘겨 둔 상태에서
    givenCalendars(MONTH);
    const { rerender } = render(<CalendarStrip onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '이전' }));

    // When URL의 date가 8월 20일로 바뀌면
    rerender(<CalendarStrip date="2026-08-20" onSelect={vi.fn()} />);

    // Then 훑던 주를 내려놓고 20일의 주를 묻는다
    expect(lastWeekQuery()).toBe('2026-08-20');
  });
});
