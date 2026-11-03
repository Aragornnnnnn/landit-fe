// TabBar — 고를 게 있을 때만 칩을 그리고, 현재 탭을 활성으로 표시하는지 검증
import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';

import { introGuideSeen } from '../_model/intro-guide-seen';
import {
  setHomeCovered,
  smalltalkNudgeSeen,
  useFreeNudgeFirst,
  useFreeNudgeShown,
} from '../_model/smalltalk-free-nudge';
import { NUDGE_LEAD_MS, NUDGE_WAIT_MS } from '../_model/useFreeNudge';
import { scenarioFeedbackSeen } from '../../_model/scenario-feedback-seen';
import { TabBar } from './TabBar';
import type { Tab } from './tabs';

const mocks = vi.hoisted(() => ({
  pathname: '/scenario',
  locked: false,
  deciding: false,
  // 프리미엄 프리뷰가 홈에 띄운 화면 — 'none'이면 프리뷰가 화면에 없다
  previewScreen: 'none',
  limitMs: 300_000 as number | null,
  // 서버의 무료 5분 정책 적용 여부
  trialEnabled: true,
  promoOpen: false,
  showerHold: false,
  updateFirst: false,
  // 서버의 배울 영어 — null이면 아직 안 답해 ProfileGate가 덮는다
  accentLocale: 'EN_US' as string | null,
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
        : {
            dailySpeakingTimeLimitMs: mocks.limitMs,
            freeTrialEnabled: mocks.trialEnabled,
          },
  }),
}));
vi.mock('@/features/subscription/model/exit-promo/promo-handoff', () => ({
  usePromoSheetOpen: () => mocks.promoOpen,
}));
vi.mock('@/features/app-update/model/useForceUpdateFirst', () => ({
  useForceUpdateFirst: () => mocks.updateFirst,
}));
vi.mock('@/features/onboarding/model/useAccentQuery', () => ({
  useAccentQuery: () => ({
    isSuccess: true,
    data: { accentLocale: mocks.accentLocale },
  }),
}));
vi.mock('../_model/useEarnShowerHold', () => ({
  useEarnShowerHold: () => mocks.showerHold,
}));
vi.mock('@/features/subscription/model/paywall-gate/usePaywallGate', () => ({
  usePaywallGate: () => ({ locked: mocks.locked, deciding: mocks.deciding }),
}));
vi.mock('../../_model/usePremiumPreview', () => ({
  usePremiumPreview: () => ({ screen: mocks.previewScreen }),
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

// 홈 화면이 덮개 상태를 알린 뒤로 시작한다 — 실제로는 시나리오 탭이 마운트되며 알린다
beforeEach(() => setHomeCovered(false));

afterEach(() => {
  cleanup();
  localStorage.clear();
  mocks.pathname = '/scenario';
  mocks.locked = false;
  mocks.deciding = false;
  mocks.previewScreen = 'none';
  mocks.limitMs = 300_000;
  mocks.trialEnabled = true;
  mocks.promoOpen = false;
  mocks.showerHold = false;
  mocks.updateFirst = false;
  mocks.accentLocale = 'EN_US';
  vi.useRealTimers();
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

  it('예전 안내를 본 구독자는 새 안내 점을 붙이지 않는다 — 구독자에겐 새로 알릴 무료 5분이 없다', () => {
    // Given 예전 안내를 본 구독자
    localStorage.setItem('landit-smalltalk-intro-guide-seen-v2', '1');

    // When 셸이 탭 칩을 그리면
    render(<TabBar tabs={[scenario, smalltalk]} />);

    // Then 점이 없다
    expect(greetingDot()).not.toBeInTheDocument();
  });

  it('예전 안내를 본 무료 사용자는 새 안내 점을 붙인다 — 무료 5분을 알려야 한다', () => {
    // Given 예전 안내를 본 무료 사용자
    localStorage.setItem('landit-smalltalk-intro-guide-seen-v2', '1');
    mocks.locked = true;

    // When 셸이 탭 칩을 그리면
    render(<TabBar tabs={[scenario, smalltalk]} />);

    // Then 점이 붙는다
    expect(greetingDot()).toBeInTheDocument();
  });

  it('정책이 아직 꺼진 것으로 확인된 무료 사용자에겐 점을 붙이지 않는다 — 들어가도 안내가 정책을 기다린다', () => {
    // Given 정책 적용 시각 전의 무료 사용자
    mocks.locked = true;
    mocks.trialEnabled = false;

    // When 셸이 탭 칩을 그리면
    render(<TabBar tabs={[scenario, smalltalk]} />);

    // Then 점이 없다
    expect(greetingDot()).not.toBeInTheDocument();
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
    it('대화 피드백을 본 무료 사용자에게 스몰톡 칩 아래 말풍선을 띄운다', () => {
      // Given 대화 피드백을 본 무료 사용자가 시나리오 탭에 돌아왔을 때
      mocks.locked = true;
      scenarioFeedbackSeen.mark();

      // When 셸이 탭 칩을 그리면
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 서버가 준 한도만큼 무료로 써 볼 수 있다고 알린다 — 점은 같은 자리를 말하니 붙이지 않는다
      expect(freeNudge()).toHaveTextContent('스몰톡 5분을 무료로 드렸어요');
      expect(greetingDot()).not.toBeInTheDocument();
    });

    it('대화 피드백을 아직 안 봤으면 띄우지 않는다', () => {
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
      scenarioFeedbackSeen.mark();

      // When 셸이 탭 칩을 그리면
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 한도가 없으니 말풍선도 없다
      expect(freeNudge()).not.toBeInTheDocument();
    });

    it('하루 한 번만 띄운다 — 오늘 이미 보여 줬으면 다음 홈 방문엔 뜨지 않고 시트도 막지 않는다', () => {
      // Given 오늘 먼저 한 번 떠서 보여 준 뒤(칩은 안 누름)
      mocks.locked = true;
      scenarioFeedbackSeen.mark();
      const first = render(<TabBar tabs={[scenario, smalltalk]} />);
      expect(freeNudge()).toBeInTheDocument();
      first.unmount();

      // When 같은 날 홈에 다시 오면
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 말풍선은 쉬고, 홈의 시트들도 기다리지 않는다
      expect(freeNudge()).not.toBeInTheDocument();
      expect(renderHook(() => useFreeNudgeFirst()).result.current).toBe(false);
    });

    it('다음 날엔 다시 띄운다', () => {
      // Given 어제 보여 준 기록이 있을 때
      mocks.locked = true;
      scenarioFeedbackSeen.mark();
      localStorage.setItem('landit-smalltalk-free-nudge-shown-on', '2000-1-1');

      // When 오늘 홈에 오면
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 다시 뜬다
      expect(freeNudge()).toBeInTheDocument();
    });

    it('말풍선이 안 뜬 날이라도 스몰톡 탭에 들어가면 영영 꺼진다', () => {
      // Given 오늘 이미 말풍선을 본 뒤(칩은 안 누름) 마지막 탭 기억으로 스몰톡에 들어온 사용자
      mocks.locked = true;
      scenarioFeedbackSeen.mark();
      localStorage.setItem(
        'landit-smalltalk-free-nudge-shown-on',
        `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`,
      );
      mocks.pathname = '/smalltalk';

      // When 셸이 탭 칩을 그리면
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 스몰톡을 봤다고 남아 다음 날에도 뜨지 않는다
      expect(smalltalkNudgeSeen.has()).toBe(true);
    });

    it('구독을 아직 못 받아 판정 중이면 말풍선 차례로 알려 공지가 기다린다 — 뜨진 않는다', () => {
      // Given 무료 표현을 마쳤고 구독 응답이 아직인 사용자
      mocks.deciding = true;
      scenarioFeedbackSeen.mark();

      // When 셸이 탭 칩을 그리면
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 차례라고 알리되, 무료인지 확정 전이라 말풍선은 아직 없다
      expect(renderHook(() => useFreeNudgeFirst()).result.current).toBe(true);
      expect(freeNudge()).not.toBeInTheDocument();
    });

    it('프리미엄 프리뷰가 화면에 있는 동안은 기다린다 — 튜토리얼·무료 표현이 끝나면 그때 뜬다', () => {
      // Given 피드백을 본 무료 사용자의 홈에 프리뷰 튜토리얼이 떠 있을 때
      mocks.locked = true;
      mocks.previewScreen = 'tutorial';
      scenarioFeedbackSeen.mark();

      // When 셸이 탭 칩을 그리면
      const { rerender } = render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 말풍선도 차례 알림도 없다
      expect(freeNudge()).not.toBeInTheDocument();
      expect(renderHook(() => useFreeNudgeFirst()).result.current).toBe(false);

      // When 프리뷰가 끝나면(무료 표현을 마쳤거나 중간에 나감)
      mocks.previewScreen = 'none';
      rerender(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 그제야 뜬다
      expect(freeNudge()).toBeInTheDocument();
    });

    it('말풍선이 뜨고 잠깐 뒤엔 차례를 내려놓는다 — 칩을 안 눌러도 공지·소감이 그 방문에 나선다', () => {
      // Given 말풍선이 떠 있는 무료 유저
      vi.useFakeTimers();
      mocks.locked = true;
      scenarioFeedbackSeen.mark();
      render(<TabBar tabs={[scenario, smalltalk]} />);
      expect(freeNudge()).toBeInTheDocument();
      expect(renderHook(() => useFreeNudgeFirst()).result.current).toBe(true);

      // When 앞에 서는 시간이 지나면
      act(() => vi.advanceTimersByTime(NUDGE_LEAD_MS));

      // Then 말풍선은 그대로 두고 차례만 내려놓는다
      expect(freeNudge()).toBeInTheDocument();
      expect(renderHook(() => useFreeNudgeFirst()).result.current).toBe(false);
    });

    it('판정이 끝나지 않아 못 뜨면 잠깐 기다리다 그 방문엔 차례를 내려놓는다', () => {
      // Given 구독 판정이 끝나지 않는 피드백 본 유저
      vi.useFakeTimers();
      mocks.deciding = true;
      scenarioFeedbackSeen.mark();
      render(<TabBar tabs={[scenario, smalltalk]} />);
      expect(renderHook(() => useFreeNudgeFirst()).result.current).toBe(true);

      // When 기다리는 시간이 지나면
      act(() => vi.advanceTimersByTime(NUDGE_WAIT_MS));

      // Then 공지·소감을 더 막지 않는다
      expect(renderHook(() => useFreeNudgeFirst()).result.current).toBe(false);
    });

    it('못 뜬 채 차례를 내려놓은 방문엔 판정이 늦게 끝나도 띄우지 않는다 — 이어 뜬 공지·소감과 겹치지 않게', () => {
      // Given 구독 판정이 늦어 기다리다 차례를 내려놓은 피드백 본 유저
      vi.useFakeTimers();
      mocks.deciding = true;
      scenarioFeedbackSeen.mark();
      const { rerender } = render(<TabBar tabs={[scenario, smalltalk]} />);
      act(() => vi.advanceTimersByTime(NUDGE_WAIT_MS));

      // When 그 뒤에야 무료 사용자로 판정되면
      mocks.deciding = false;
      mocks.locked = true;
      rerender(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 이번 방문엔 띄우지 않고 오늘 몫도 남겨 둔다
      expect(freeNudge()).not.toBeInTheDocument();
      expect(
        localStorage.getItem('landit-smalltalk-free-nudge-shown-on'),
      ).toBeNull();
    });

    it.each([
      ['강제 업데이트', () => (mocks.updateFirst = true)],
      ['배울 영어 묻기', () => (mocks.accentLocale = null)],
      ['홈의 램프·소감 시트', () => setHomeCovered(true)],
    ])(
      '%s가 화면을 덮는 동안엔 뜨지 않고 오늘 보여 준 것으로도 남기지 않는다',
      (_, cover) => {
        // Given 말풍선 대상인데 화면이 덮여 있을 때
        mocks.locked = true;
        scenarioFeedbackSeen.mark();
        cover();

        // When 셸이 탭 칩을 그리면
        render(<TabBar tabs={[scenario, smalltalk]} />);

        // Then 가려진 채 하루 몫을 쓰지 않는다
        expect(freeNudge()).not.toBeInTheDocument();
        expect(
          localStorage.getItem('landit-smalltalk-free-nudge-shown-on'),
        ).toBeNull();
      },
    );

    it('홈 화면이 아직 덮개 상태를 알리지 않았으면 띄우지 않는다 — 막 들어와 소감·램프가 뜨기 직전에 하루 몫을 쓰지 않게', () => {
      // Given 말풍선 대상인데 홈 화면이 막 마운트되는 중이다
      mocks.locked = true;
      scenarioFeedbackSeen.mark();
      setHomeCovered(null);
      const { rerender } = render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 띄우지도 오늘 몫을 쓰지도 않는다
      expect(freeNudge()).not.toBeInTheDocument();
      expect(
        localStorage.getItem('landit-smalltalk-free-nudge-shown-on'),
      ).toBeNull();

      // When 홈이 덮을 것이 없다고 알리면(소감을 닫았거나 소감이 없는 방문)
      act(() => setHomeCovered(false));
      rerender(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 그때 뜬다
      expect(freeNudge()).toBeInTheDocument();
    });

    it('말풍선 차례면 홈 화면에 알린다 — 이벤트 공지·소감·알림 동의가 기다리게', () => {
      // Given 무료 표현을 마친 무료 사용자가 시나리오 탭에 돌아왔을 때
      mocks.locked = true;
      scenarioFeedbackSeen.mark();

      // When 셸이 탭 칩을 그리면
      const { unmount } = render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 말풍선 차례라고 알린다
      const { result } = renderHook(() => useFreeNudgeFirst());
      expect(result.current).toBe(true);

      // When 셸이 내려가면 알림도 거둔다
      unmount();
      expect(renderHook(() => useFreeNudgeFirst()).result.current).toBe(false);
    });

    it('말풍선이 뜬 방문이면 홈 화면에 알린다 — 이벤트 공지·알림 동의는 다음 방문으로 미룬다', () => {
      // Given 말풍선 대상인 무료 사용자
      mocks.locked = true;
      scenarioFeedbackSeen.mark();

      // When 말풍선이 뜨면
      const { unmount } = render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 이번 방문엔 말풍선이 떴다고 알린다
      expect(freeNudge()).toBeInTheDocument();
      expect(renderHook(() => useFreeNudgeShown()).result.current).toBe(true);

      // When 셸이 내려가면(방문이 끝나면) 알림도 거둔다
      unmount();
      expect(renderHook(() => useFreeNudgeShown()).result.current).toBe(false);
    });

    it('말풍선이 안 뜬 방문이면 떴다고 알리지 않는다 — 공지가 그대로 나선다', () => {
      // Given 구독 중인 사용자
      scenarioFeedbackSeen.mark();

      // When 셸이 탭 칩을 그리면
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 떴다고 알리지 않는다
      expect(renderHook(() => useFreeNudgeShown()).result.current).toBe(false);
    });

    it('할인 시트나 환급 동전 연출이 떠 있는 동안은 띄우지 않는다 — 겹치지 않게', () => {
      // Given 말풍선 대상인 무료 사용자가 페이월을 닫고 돌아와 할인 시트가 떠 있을 때
      mocks.locked = true;
      mocks.promoOpen = true;
      scenarioFeedbackSeen.mark();

      // When 셸이 탭 칩을 그리면
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 말풍선을 미룬다
      expect(freeNudge()).not.toBeInTheDocument();
    });

    it('서버가 무료 5분 정책을 아직 안 켰으면 띄우지 않고 차례도 잡지 않는다 — 켜지면 그때 뜬다', () => {
      // Given 말풍선 대상인 무료 사용자인데 정책 적용 시각 전일 때
      mocks.locked = true;
      mocks.trialEnabled = false;
      scenarioFeedbackSeen.mark();

      // When 셸이 탭 칩을 그리면
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 없는 5분을 알리지 않고, 다른 시트도 막지 않으며, 오늘 몫도 쓰지 않는다
      expect(freeNudge()).not.toBeInTheDocument();
      expect(renderHook(() => useFreeNudgeFirst()).result.current).toBe(false);
      expect(
        localStorage.getItem('landit-smalltalk-free-nudge-shown-on'),
      ).toBeNull();
      // 정책이 켜진 뒤 띄울 수 있게 끝난 것으로 남기지 않는다
      expect(smalltalkNudgeSeen.has()).toBe(false);
    });

    it('한도를 아직 못 받았으면 숫자 없이 띄우지 않는다', () => {
      // Given 말풍선 대상이지만 한도 조회가 끝나지 않았을 때
      mocks.locked = true;
      mocks.limitMs = null;
      scenarioFeedbackSeen.mark();

      // When 셸이 탭 칩을 그리면
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 말풍선을 미룬다
      expect(freeNudge()).not.toBeInTheDocument();
    });

    it('말풍선이 뜨면 노출을 하루 한 번 남긴다 — 같은 방문에 덮개가 걷혀 다시 떠도 한 번', () => {
      // Given 말풍선 대상인 무료 사용자
      vi.mocked(track).mockClear();
      mocks.locked = true;
      scenarioFeedbackSeen.mark();

      // When 말풍선이 뜨고, 할인 시트에 잠깐 가렸다가 다시 뜨면
      const { rerender } = render(<TabBar tabs={[scenario, smalltalk]} />);
      mocks.promoOpen = true;
      rerender(<TabBar tabs={[scenario, smalltalk]} />);
      mocks.promoOpen = false;
      rerender(<TabBar tabs={[scenario, smalltalk]} />);

      // Then 노출은 한 번만 남는다
      expect(freeNudge()).toBeInTheDocument();
      expect(
        vi
          .mocked(track)
          .mock.calls.filter(
            ([name]) => name === 'Small Talk Free Nudge Viewed',
          ),
      ).toHaveLength(1);
    });

    it('말풍선이 떠 있을 때 칩을 누르면 탭을 남긴다', async () => {
      // Given 말풍선이 떠 있을 때
      vi.mocked(track).mockClear();
      mocks.locked = true;
      scenarioFeedbackSeen.mark();
      const user = userEvent.setup();
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // When 스몰톡 칩을 누르면
      await user.click(screen.getByRole('link', { name: '스몰톡' }));

      // Then 말풍선을 보고 누른 것으로 남긴다
      expect(track).toHaveBeenCalledWith('Small Talk Free Nudge Tapped');
    });

    it('말풍선이 없을 때 칩을 누르면 말풍선 탭으로 남기지 않는다', async () => {
      // Given 말풍선 대상이 아닌 사용자(피드백을 안 봤다)
      vi.mocked(track).mockClear();
      mocks.locked = true;
      const user = userEvent.setup();
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // When 스몰톡 칩을 누르면
      await user.click(screen.getByRole('link', { name: '스몰톡' }));

      // Then 말풍선 탭은 남지 않는다
      expect(track).not.toHaveBeenCalledWith('Small Talk Free Nudge Tapped');
    });

    it('스몰톡 칩을 누르면 바로 꺼진다', async () => {
      // Given 말풍선이 떠 있을 때
      mocks.locked = true;
      scenarioFeedbackSeen.mark();
      const user = userEvent.setup();
      render(<TabBar tabs={[scenario, smalltalk]} />);

      // When 스몰톡 칩을 누르면
      await user.click(screen.getByRole('link', { name: '스몰톡' }));

      // Then 말풍선이 사라지고 다시 뜨지 않는다
      expect(freeNudge()).not.toBeInTheDocument();
      expect(smalltalkNudgeSeen.has()).toBe(true);
    });
  });
});
