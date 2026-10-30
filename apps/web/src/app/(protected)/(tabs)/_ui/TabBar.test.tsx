// TabBar — 고를 게 있을 때만 칩을 그리고, 현재 탭을 활성으로 표시하는지 검증
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';

import {
  freeExpressionFinished,
  smalltalkNudgeSeen,
} from '../../_model/smalltalk-free-nudge';
import { introGuideSeen } from '../smalltalk/_model/intro-guide-seen';
import { TabBar } from './TabBar';
import type { Tab } from './tabs';

const mocks = vi.hoisted(() => ({
  pathname: '/scenario',
  locked: false,
  limitMs: 300_000 as number | null,
  promoOpen: false,
  showerHold: false,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
}));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('@/features/small-talk/model/useSmallTalkMainQuery', () => ({
  useSmallTalkMainQuery: () => ({
    main:
      mocks.limitMs === null
        ? null
        : { dailySpeakingTimeLimitMs: mocks.limitMs },
  }),
}));
vi.mock('@/features/subscription/model/exit-promo/promo-handoff', () => ({
  usePromoSheetOpen: () => mocks.promoOpen,
}));
vi.mock('../_model/useEarnShowerHold', () => ({
  useEarnShowerHold: () => mocks.showerHold,
}));
vi.mock('@/features/subscription/model/paywall-gate/usePaywallGate', () => ({
  usePaywallGate: () => ({ locked: mocks.locked }),
}));

// next/link는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다(vitest.config의 별칭은 소스용).
// 여기서 검증할 건 주소·활성 표시·클릭이라 평범한 앵커로 대체한다 (jsdom엔 이동이 없어 기본 동작만 막는다)
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    onClick,
    ...rest
  }: React.ComponentProps<'a'>) => (
    <a
      href={href}
      {...rest}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  ),
}));

const scenario: Tab = {
  id: 'scenario',
  href: '/scenario',
  labelKey: 'scenarioLabel',
  ready: true,
};
const smalltalk: Tab = {
  id: 'smalltalk',
  href: '/smalltalk',
  labelKey: 'smalltalkLabel',
  ready: true,
};

afterEach(() => {
  cleanup();
  localStorage.clear();
  mocks.pathname = '/scenario';
  mocks.locked = false;
  mocks.limitMs = 300_000;
  mocks.promoOpen = false;
  mocks.showerHold = false;
});

const greetingDot = () => screen.queryByTestId('smalltalk-greeting-dot');
const freeNudge = () => screen.queryByTestId('smalltalk-free-nudge');

describe('TabBar', () => {
  it('보이는 탭이 하나뿐이면 칩을 그리지 않는다', () => {
    // Given 시나리오 탭만 준비된 상태에서
    // When 셸이 탭 칩을 그리면
    const { container } = render(<TabBar tabs={[scenario]} />);

    // Then 고를 게 없으므로 아무것도 나오지 않는다
    expect(container).toBeEmptyDOMElement();
  });

  it('탭이 둘 이상이면 각 탭의 칩을 그린다', () => {
    // Given 시나리오와 스몰톡이 모두 준비된 상태에서
    // When 셸이 탭 칩을 그리면
    render(<TabBar tabs={[scenario, smalltalk]} />);

    // Then 두 칩이 각자의 주소를 가리킨다
    expect(screen.getByRole('link', { name: '시나리오' })).toHaveAttribute(
      'href',
      '/scenario',
    );
    expect(screen.getByRole('link', { name: '스몰톡' })).toHaveAttribute(
      'href',
      '/smalltalk',
    );
  });

  it('현재 보고 있는 탭의 칩만 활성으로 표시한다', () => {
    // Given 시나리오 탭을 보고 있는 상태에서
    mocks.pathname = '/scenario';

    // When 셸이 탭 칩을 그리면
    render(<TabBar tabs={[scenario, smalltalk]} />);

    // Then 시나리오 칩만 현재 페이지로 표시된다
    expect(screen.getByRole('link', { name: '시나리오' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: '스몰톡' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('다른 탭 칩을 누르면 어느 탭으로 갔는지 남긴다', async () => {
    mocks.pathname = '/scenario';
    const user = userEvent.setup();
    render(<TabBar tabs={[scenario, smalltalk]} />);

    await user.click(screen.getByRole('link', { name: '스몰톡' }));

    expect(track).toHaveBeenCalledWith('Home Tab Switched', {
      tab: 'smalltalk',
    });
  });

  it('지금 보고 있는 탭 칩을 다시 눌러도 전환으로 세지 않는다', async () => {
    mocks.pathname = '/scenario';
    const user = userEvent.setup();
    render(<TabBar tabs={[scenario, smalltalk]} />);

    await user.click(screen.getByRole('link', { name: '시나리오' }));

    expect(track).not.toHaveBeenCalled();
  });

  it('첫 안내를 아직 안 본 기기면 스몰톡 칩에 점을 붙인다', () => {
    // Given 스몰톡 첫 안내를 한 번도 안 본 기기에서
    // When 셸이 탭 칩을 그리면
    render(<TabBar tabs={[scenario, smalltalk]} />);

    // Then 스몰톡 칩이 점으로 눈짓한다
    expect(greetingDot()).toBeInTheDocument();
  });

  it('첫 안내를 본 기기면 점을 붙이지 않는다', () => {
    // Given 스몰톡 첫 안내를 본 기기에서
    introGuideSeen.mark();

    // When 셸이 탭 칩을 그리면
    render(<TabBar tabs={[scenario, smalltalk]} />);

    // Then 더 알릴 게 없으니 점은 없다
    expect(greetingDot()).not.toBeInTheDocument();
  });

  it('스몰톡 화면에서 첫 안내를 닫으면 점이 바로 사라진다', () => {
    // Given 점이 붙은 채로 탭 셸이 서 있을 때
    render(<TabBar tabs={[scenario, smalltalk]} />);

    // When 다른 화면(스몰톡)에서 첫 안내를 닫아 기록하면
    act(() => introGuideSeen.mark());

    // Then 셸이 리마운트되지 않아도 점이 사라진다
    expect(greetingDot()).not.toBeInTheDocument();
  });

  describe('무료 5분 말풍선', () => {
    it('무료 표현을 마친 무료 사용자에게 스몰톡 칩 아래 말풍선을 띄운다', () => {
      // Given 무료 표현을 끝까지 마친 무료 사용자가 시나리오 탭에 돌아왔을 때
      mocks.locked = true;
      freeExpressionFinished.mark();

      // When 셸이 탭 칩을 그리면
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 서버가 준 한도만큼 무료로 써 볼 수 있다고 알린다 — 점은 같은 자리를 말하니 붙이지 않는다
      expect(freeNudge()).toHaveTextContent('스몰톡 5분을 무료로 드렸어요');
      expect(greetingDot()).not.toBeInTheDocument();
    });

    it('무료 표현을 마치지 않았으면 띄우지 않는다', () => {
      // Given 프리뷰를 넘겼거나 아직인 무료 사용자
      mocks.locked = true;

      // When 셸이 탭 칩을 그리면
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 말풍선은 없다
      expect(freeNudge()).not.toBeInTheDocument();
    });

    it('구독 중이면 띄우지 않는다', () => {
      // Given 무료 표현을 마친 뒤 구독한 사용자
      mocks.locked = false;
      freeExpressionFinished.mark();

      // When 셸이 탭 칩을 그리면
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 한도가 없으니 말풍선도 없다
      expect(freeNudge()).not.toBeInTheDocument();
    });

    it('할인 시트나 환급 동전 연출이 떠 있는 동안은 띄우지 않는다 — 겹치지 않게', () => {
      // Given 말풍선 대상인 무료 사용자가 페이월을 닫고 돌아와 할인 시트가 떠 있을 때
      mocks.locked = true;
      mocks.promoOpen = true;
      freeExpressionFinished.mark();

      // When 셸이 탭 칩을 그리면
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 말풍선을 미룬다
      expect(freeNudge()).not.toBeInTheDocument();
    });

    it('한도를 아직 못 받았으면 숫자 없이 띄우지 않는다', () => {
      // Given 말풍선 대상이지만 한도 조회가 끝나지 않았을 때
      mocks.locked = true;
      mocks.limitMs = null;
      freeExpressionFinished.mark();

      // When 셸이 탭 칩을 그리면
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 말풍선을 미룬다
      expect(freeNudge()).not.toBeInTheDocument();
    });

    it('스몰톡 칩을 누르면 바로 꺼진다', async () => {
      // Given 말풍선이 떠 있을 때
      mocks.locked = true;
      freeExpressionFinished.mark();
      const user = userEvent.setup();
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // When 스몰톡 칩을 누르면
      await user.click(screen.getByRole('link', { name: '스몰톡' }));

      // Then 말풍선이 사라지고 다시 뜨지 않는다
      expect(freeNudge()).not.toBeInTheDocument();
      expect(smalltalkNudgeSeen.has()).toBe(true);
    });

    it('스몰톡 탭에 들어가면 사라지고 다시 뜨지 않는다', () => {
      // Given 말풍선 대상인 무료 사용자가 스몰톡 탭에 들어왔을 때
      mocks.locked = true;
      freeExpressionFinished.mark();
      mocks.pathname = '/smalltalk';

      // When 셸이 탭 칩을 그리면
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 말풍선은 없고, 들어가 본 것으로 남는다
      expect(freeNudge()).not.toBeInTheDocument();
      expect(smalltalkNudgeSeen.has()).toBe(true);
    });
  });
});
