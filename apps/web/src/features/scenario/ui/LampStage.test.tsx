// 램프 자리의 계측 계약 검증 — 대화 시작 전 갈림길 세 곳(직접 시작·프롬프트 수락·거절)만 기록한다
import { EVENTS } from '@landit/analytics';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';

import { LampStage } from './LampStage';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

// next/image는 자기 밑 react 복사본을 잡아 렌더러 아이덴티티가 갈라진다 — 순수 img로 치환한다
vi.mock('next/image', async () => {
  const { createElement } = await import('react');
  return {
    default: ({ src, alt }: { src: string; alt: string }) =>
      createElement('img', { src, alt }),
  };
});

const trackMock = vi.mocked(track);

beforeEach(() => {
  trackMock.mockReset();
  // 소환 게이트 기록을 비운다 — 지난 테스트의 "오늘 봤음" 표식이 자동 소환을 막는다
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});

afterEach(() => cleanup());

describe('LampStage 계측', () => {
  it('자고 있는 카드에서 시작 버튼을 누르면 시작 탭을 기록한다', () => {
    render(<LampStage onStart={vi.fn()} retry />);

    fireEvent.click(
      screen.getByRole('button', { name: '램프 문질러 대화 시작하기' }),
    );

    expect(trackMock).toHaveBeenCalledWith(EVENTS.CONVERSATION_START_TAPPED, {
      retry: true,
    });
  });

  it('직접 부른 소환이 대화로 이어져도 프롬프트 응답은 기록하지 않는다', async () => {
    // given — 자동 소환 없이(오늘 정보 없음) 카드만 떠 있는 상태에서
    const onStart = vi.fn();
    render(<LampStage onStart={onStart} />);

    // when — 시작 버튼을 직접 누르면 소환을 거쳐 대화로 넘어간다
    fireEvent.click(
      screen.getByRole('button', { name: '램프 문질러 대화 시작하기' }),
    );
    await waitFor(() => expect(onStart).toHaveBeenCalled());

    // then — 이미 시작 탭으로 기록했다. 묻지 않았으니 답도 없다
    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith(EVENTS.CONVERSATION_START_TAPPED, {
      retry: false,
    });
  });

  it('자동으로 물어본 프롬프트에서 네!를 누르면 수락을 기록한다', async () => {
    const onStart = vi.fn();
    render(<LampStage onStart={onStart} today="2026-08-07" />);

    fireEvent.click(await screen.findByRole('button', { name: '네!' }));

    expect(trackMock).toHaveBeenCalledWith(
      EVENTS.CONVERSATION_PROMPT_ACCEPTED,
      { retry: false },
    );
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('자동으로 물어본 프롬프트를 X로 닫으면 거절을 기록한다', async () => {
    const onStart = vi.fn();
    const onSummonClose = vi.fn();
    render(
      <LampStage
        onStart={onStart}
        today="2026-08-07"
        onSummonClose={onSummonClose}
        retry
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: '나가기' }));

    expect(trackMock).toHaveBeenCalledWith(
      EVENTS.CONVERSATION_PROMPT_DISMISSED,
      { retry: true },
    );
    expect(onStart).not.toHaveBeenCalled();
    expect(onSummonClose).toHaveBeenCalledTimes(1);
  });

  it('온보딩 직후엔 묻지 않고 넘어가므로 아무것도 기록하지 않는다', async () => {
    // given — 온보딩 마지막에 "시작할게요"라 답하고 온 진입 (?onboarded=1)
    window.history.replaceState(null, '', '/?onboarded=1');
    const onStart = vi.fn();

    // when — 자동 소환이 묻지 않고 바로 대화로 넘긴다
    render(<LampStage onStart={onStart} today="2026-08-07" />);
    await waitFor(() => expect(onStart).toHaveBeenCalled());

    // then — 누른 버튼이 하나도 없다. 기록할 행동도 없다
    expect(trackMock).not.toHaveBeenCalled();
  });
});
