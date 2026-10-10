// 환급 내역 화면 검증 — 무엇을 보여 주고 언제 이어 받는지
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HistoryRow } from '@/features/reward/model/reward-history';
import type { useRewardHistoryQuery } from '@/features/reward/model/useRewardHistoryQuery';

import { RefundHistoryFeed } from './RefundHistoryFeed';

type History = ReturnType<typeof useRewardHistoryQuery>;

const mocks = vi.hoisted(() => ({
  history: null as unknown,
  nearEnd: false,
  loadMore: vi.fn(),
  retry: vi.fn(),
}));

vi.mock('@/features/reward/model/useRewardHistoryQuery', () => ({
  useRewardHistoryQuery: () => mocks.history,
}));
// 화면 끝에 닿았는지는 브라우저가 알려 준다 — 여기서는 닿았을 때 무엇을 하는지만 본다
vi.mock('@/shared/lib/useInView', () => ({
  useInView: () => ({ ref: () => {}, inView: mocks.nearEnd }),
}));

const row = (id: string, patch: Partial<HistoryRow> = {}): HistoryRow => ({
  id,
  dateLabel: '10.10',
  title: '표현학습 완료',
  note: '08:24',
  amountWon: 11,
  balanceWon: 2015,
  ...patch,
});

// 내역 한 줄을 받아 둔, 더 받을 것이 없는 상태에서 달라지는 것만 적는다
const given = (patch: Partial<History>) => {
  const history: History = {
    rows: [row('1')],
    error: null,
    retry: mocks.retry,
    hasMore: false,
    fetching: false,
    loadingMore: false,
    moreFailed: false,
    loadMore: mocks.loadMore,
    ...patch,
  };
  mocks.history = history;
};

beforeEach(() => {
  mocks.nearEnd = false;
  given({});
});
afterEach(cleanup);

describe('RefundHistoryFeed', () => {
  it('받은 내역을 한 줄씩 보여 준다', () => {
    given({ rows: [row('2', { title: '스몰톡 완료' }), row('1')] });

    render(<RefundHistoryFeed />);

    expect(screen.getByText('스몰톡 완료')).toBeInTheDocument();
    expect(screen.getByText('표현학습 완료')).toBeInTheDocument();
  });

  it('첫 장을 받는 동안에는 줄이 놓일 자리를 보여 준다', () => {
    given({ rows: null, fetching: true });

    render(<RefundHistoryFeed />);

    expect(
      screen.getByRole('status', { name: '환급 내역을 불러오는 중' }),
    ).toBeInTheDocument();
  });

  it('내역이 하나도 없으면 그렇게 말한다', () => {
    given({ rows: [] });

    render(<RefundHistoryFeed />);

    expect(screen.getByText('아직 내역이 없어요')).toBeInTheDocument();
  });

  it('첫 장을 받지 못했으면 다시 시도를 권한다', () => {
    given({ rows: null, error: new Error('네트워크 오류') });
    render(<RefundHistoryFeed />);

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(mocks.retry).toHaveBeenCalledTimes(1);
  });

  it('첫 장을 다시 받는 동안에는 실패 문구 대신 줄이 놓일 자리를 보여 준다', () => {
    given({ rows: null, error: new Error('네트워크 오류'), fetching: true });

    render(<RefundHistoryFeed />);

    expect(
      screen.queryByText('내역을 불러오지 못했어요'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: '환급 내역을 불러오는 중' }),
    ).toBeInTheDocument();
  });

  it('끝까지 내리면 이전 내역을 이어 받는다', () => {
    mocks.nearEnd = true;
    given({ hasMore: true });

    render(<RefundHistoryFeed />);

    expect(mocks.loadMore).toHaveBeenCalledTimes(1);
  });

  it('더 받을 것이 없으면 끝에 닿아도 받지 않는다', () => {
    mocks.nearEnd = true;

    render(<RefundHistoryFeed />);

    expect(mocks.loadMore).not.toHaveBeenCalled();
  });

  it('받는 동안에는 불러오고 있다고 알리고 또 받지 않는다', () => {
    mocks.nearEnd = true;
    given({ hasMore: true, fetching: true, loadingMore: true });

    render(<RefundHistoryFeed />);

    expect(screen.getByText('내역을 불러오고 있어요')).toBeInTheDocument();
    expect(mocks.loadMore).not.toHaveBeenCalled();
  });

  it('처음부터 다시 받는 중에는 끝에 닿아도 다음 장을 묻지 않는다', () => {
    // given — 앱에 돌아와 내역 전체를 다시 받는 중이다. 여기서 다음 장을 물으면 앞쪽 줄이 옛 값으로 남는다
    mocks.nearEnd = true;
    given({ hasMore: true, fetching: true });

    render(<RefundHistoryFeed />);

    expect(mocks.loadMore).not.toHaveBeenCalled();
  });

  it('받은 장이 전부 걸러져 줄이 늘지 않아도 끝이 보이면 이어서 받는다', () => {
    // given — 모르는 종류의 줄만 든 장을 받았다. 줄은 그대로고 받을 것은 남았다
    mocks.nearEnd = true;
    given({ rows: [], hasMore: true, fetching: true, loadingMore: true });
    const { rerender } = render(<RefundHistoryFeed />);

    given({ rows: [], hasMore: true });
    rerender(<RefundHistoryFeed />);

    expect(mocks.loadMore).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('아직 내역이 없어요')).not.toBeInTheDocument();
  });

  it('이어 받기가 실패하면 끝이 보여도 스스로 다시 묻지 않고, 보던 내역은 그대로 둔다', () => {
    mocks.nearEnd = true;
    given({ hasMore: true, moreFailed: true });

    render(<RefundHistoryFeed />);

    expect(mocks.loadMore).not.toHaveBeenCalled();
    expect(screen.getByText('표현학습 완료')).toBeInTheDocument();
  });

  it('이어 받기가 실패한 뒤 다시 시도를 누르면 이어 받는다', () => {
    mocks.nearEnd = true;
    given({ hasMore: true, moreFailed: true });
    render(<RefundHistoryFeed />);

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(mocks.loadMore).toHaveBeenCalledTimes(1);
  });

  it('다시 시도해 받는 동안에는 실패 문구를 거두고 불러오고 있다고 알린다', () => {
    given({
      hasMore: true,
      moreFailed: true,
      fetching: true,
      loadingMore: true,
    });

    render(<RefundHistoryFeed />);

    expect(
      screen.queryByText('이전 내역을 불러오지 못했어요'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('내역을 불러오고 있어요')).toBeInTheDocument();
  });

  it('이어 받기 알림 자리는 받기 전부터 있고, 받는 동안 그 안에 글자가 들어온다', () => {
    given({ hasMore: true });
    const { rerender } = render(<RefundHistoryFeed />);
    const notice = screen.getByRole('status');
    expect(notice).toBeEmptyDOMElement();

    given({ hasMore: true, fetching: true, loadingMore: true });
    rerender(<RefundHistoryFeed />);

    expect(notice).toHaveTextContent('내역을 불러오고 있어요');
  });
});
