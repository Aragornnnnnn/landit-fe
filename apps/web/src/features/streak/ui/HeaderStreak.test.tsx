// 헤더 열매 검증 — 일수는 눈에 안 보이고 읽어 주기로만 남는다.
// 아직 못 받은 것과 받다 실패한 것을 같은 0일로 읽어 주면 틀린 일수를 듣게 된다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as streakQuery from '../model/useStreakQuery';
import { HeaderStreak } from './HeaderStreak';

vi.mock('../model/useStreakQuery', () => ({ useStreakQuery: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

// next/link·next/image는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 (TabBar 테스트와 같은 이유).
// 여기서 볼 건 읽어 주는 이름이라 평범한 앵커·이미지로 대체한다
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: React.ComponentProps<'a'>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
// 열매 그림은 alt가 빈 장식 이미지라 자리만 채운다
vi.mock('next/image', () => ({ default: () => <span /> }));

const useStreakQuery = vi.mocked(streakQuery.useStreakQuery);

const streakOf = (currentStreakDays: number, activeToday: boolean) => ({
  currentStreakDays,
  activeToday,
  today: '2026-08-05',
});

afterEach(cleanup);

beforeEach(() => {
  useStreakQuery.mockReset();
});

describe('HeaderStreak', () => {
  it('아직 못 받았으면 일수를 말하지 않는다', () => {
    // given — 앱을 새로 켜 캐시가 비어 있다
    useStreakQuery.mockReturnValue({ streak: null, isPending: true });

    // when
    render(<HeaderStreak />);

    // then — 0일이라고 읽어 주면 응답이 오기 전에 틀린 일수를 들려주게 된다
    expect(screen.getByRole('link')).toHaveAccessibleName('연속 기록 보기');
  });

  it('받으면 일수를 읽어 준다', () => {
    useStreakQuery.mockReturnValue({
      streak: streakOf(7, true),
      isPending: false,
    });

    render(<HeaderStreak />);

    expect(screen.getByRole('link')).toHaveAccessibleName(
      '연속 학습 7일, 연속 기록 보기',
    );
  });

  it('조회에 실패하면 0일로 자리를 지킨다', () => {
    // given — 실패는 '모르는 중'이 아니다. 홈은 스트릭 없이도 돌아야 한다
    useStreakQuery.mockReturnValue({ streak: null, isPending: false });

    render(<HeaderStreak />);

    expect(screen.getByRole('link')).toHaveAccessibleName(
      '연속 학습 0일, 연속 기록 보기',
    );
  });
});
