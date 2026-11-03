// ChoiceList — 선택지가 화면을 넘칠 때 아래에 더 있다는 것을 보여 준다
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChoiceList } from './ChoiceList';

// jsdom은 레이아웃을 계산하지 않아 스크롤 수치를 직접 준다
const mockMetrics = ({
  scrollHeight,
  clientHeight,
}: {
  scrollHeight: number;
  clientHeight: number;
}) => {
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(
    scrollHeight,
  );
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(
    clientHeight,
  );
};

const renderList = () =>
  render(
    <ChoiceList role="group" titleId="title">
      <button>보기</button>
    </ChoiceList>,
  );

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ChoiceList', () => {
  it('선택지가 넘치면 아래에 더 있다는 표시를 보여 준다', () => {
    mockMetrics({ scrollHeight: 600, clientHeight: 400 });

    renderList();

    expect(screen.getByTestId('choice-list-more')).toBeInTheDocument();
  });

  it('선택지가 다 보이면 표시하지 않는다', () => {
    mockMetrics({ scrollHeight: 400, clientHeight: 400 });

    renderList();

    expect(screen.queryByTestId('choice-list-more')).toBeNull();
  });

  it('끝까지 내리면 표시를 거둔다', () => {
    mockMetrics({ scrollHeight: 600, clientHeight: 400 });
    renderList();
    const list = screen.getByRole('group');

    list.scrollTop = 200;
    fireEvent.scroll(list);

    expect(screen.queryByTestId('choice-list-more')).toBeNull();
  });

  it('화면 높이가 줄어 넘치게 되면 표시를 보여 준다', () => {
    mockMetrics({ scrollHeight: 400, clientHeight: 400 });
    renderList();

    mockMetrics({ scrollHeight: 400, clientHeight: 300 });
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(screen.getByTestId('choice-list-more')).toBeInTheDocument();
  });
});
