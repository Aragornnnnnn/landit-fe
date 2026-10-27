// 튜토리얼은 키보드로도 넘긴다 — 「다음 문장」 버튼은 다 쓴 문장만 넘기고, 다 쓴 문장만 읽어 준다
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';
import { setTestLocale } from '@/shared/i18n/test-locale';

import { PreviewIntro } from './PreviewIntro';

const mocks = vi.hoisted(() => ({ haptic: vi.fn() }));
vi.mock('@/shared/haptics', () => ({ haptic: mocks.haptic }));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  mocks.haptic.mockClear();
});

const nextSentence = () =>
  fireEvent.click(screen.getByRole('button', { name: '다음 문장' }));
// 시계는 한 자마다 다시 걸린다 — 한 칸씩 흘려야 다음 타이머가 잡힌다
const runClock = () => {
  for (let i = 0; i < 200; i += 1) act(() => vi.advanceTimersByTime(60));
};

describe('PreviewIntro', () => {
  it('쓰는 중에 「다음 문장」을 눌러도 문장을 건너뛰지 않는다 — 다 읽어야 넘어간다', () => {
    // Given 첫 문장을 쓰기 시작한 튜토리얼
    render(<PreviewIntro dailyWon={500} onDone={vi.fn()} />);

    // When 다음 문장 버튼을 연달아 누르면
    nextSentence();
    nextSentence();

    // Then 문장이 끝까지 나오지 않아 읽기 칸이 비어 있다
    expect(
      screen.queryByText(
        /방금처럼 대화를 끝낼 때마다\s*500원을 받을 수 있어요/,
      ),
    ).not.toBeInTheDocument();
  });

  it('다 쓴 문장은 한 번 읽어 준다', () => {
    // Given 첫 문장을 쓰기 시작한 튜토리얼
    vi.useFakeTimers();
    render(<PreviewIntro dailyWon={500} onDone={vi.fn()} />);

    // When 문장을 다 쓰고 나면
    runClock();

    // Then 다 쓴 문장이 읽기 칸에 들어간다 — 대화를 끝낼 때마다 받는다고 말한다
    expect(
      screen.getByText(/방금처럼 대화를 끝낼 때마다\s*500원을 받을 수 있어요/),
    ).toBeInTheDocument();
  });

  it('글자를 한 자 쓸 때마다 가볍게 진동하고, 빈칸에서는 울리지 않는다 — 타자 치는 느낌', () => {
    // Given 첫 문장 「프리미엄 유저라면…」을 쓰기 시작한 튜토리얼
    vi.useFakeTimers();
    render(<PreviewIntro dailyWon={500} onDone={vi.fn()} />);

    // When 다섯 자(프·리·미·엄·빈칸)를 쓰는 동안
    for (let i = 0; i < 5; i += 1) act(() => vi.advanceTimersByTime(55));

    // Then 글자 넷만큼만 울린다
    expect(mocks.haptic).toHaveBeenCalledTimes(4);
  });

  it('다 쓴 문장에서 누르면 넘긴 문장의 순번을 남긴다', () => {
    // Given 첫 문장을 다 쓴 튜토리얼
    vi.useFakeTimers();
    render(<PreviewIntro dailyWon={500} onDone={vi.fn()} />);
    runClock();

    // When 다시 누르면
    nextSentence();

    // Then 첫 문장(0)을 넘겼다고 한 번 남긴다
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('Premium Preview Intro Advanced', {
      sentence_index: 0,
    });
  });

  it('쓰는 중에 누른 것은 넘김으로 남기지 않는다', () => {
    render(<PreviewIntro dailyWon={500} onDone={vi.fn()} />);

    nextSentence();

    expect(track).not.toHaveBeenCalled();
  });

  it('마지막 문장 뒤 버튼을 누르면 튜토리얼을 마쳤다고 남기고 끝낸다', () => {
    // Given 세 문장을 다 넘겨 마지막 버튼이 뜬 튜토리얼
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<PreviewIntro dailyWon={500} onDone={onDone} />);
    runClock();
    for (let i = 0; i < 2; i += 1) {
      nextSentence();
      runClock();
    }

    // When 버튼을 누르면
    fireEvent.click(screen.getByRole('button', { name: '맞춤 표현 학습하기' }));

    // Then 마쳤다고 남기고 프리뷰를 넘긴다
    expect(track).toHaveBeenCalledWith('Premium Preview Intro Completed');
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('환급을 팔지 않으면 적립 대신 매일 시나리오와 맞춤 표현을 소개한다', () => {
    // Given 환급 금액 없이 연 튜토리얼
    vi.useFakeTimers();
    render(<PreviewIntro dailyWon={null} onDone={vi.fn()} />);

    // When 첫 문장을 다 쓰면
    runClock();

    // Then 매일 시나리오를 준다고 말하고, 적립 이야기는 없다
    expect(
      screen.getByText(/매일 이렇게\s*시나리오를 하나씩\s*제공해 드려요/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/받을 수 있어요/)).not.toBeInTheDocument();
  });

  it('일본어 화면에서는 문장을 일본어로 쓰고 강조 자리도 일본어 어순을 따른다', () => {
    // Given 일본어 화면에서 환급 금액 없이 연 튜토리얼
    setTestLocale('ja');
    vi.useFakeTimers();
    render(<PreviewIntro dailyWon={null} onDone={vi.fn()} />);

    // When 첫 문장을 다 쓰면
    runClock();

    // Then 매일 시나리오 문장을 일본어로 읽어 주고, 강조는 「シナリオをひとつずつ」에 걸린다
    expect(
      screen.getByText(/毎日こうして\s*シナリオをひとつずつ\s*お届けします/),
    ).toBeInTheDocument();
    expect(screen.getByText('シナリオをひとつずつ')).toHaveClass(
      'text-[#ffd25e]',
    );
  });
});
