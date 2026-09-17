// CancelFlowScreen — 해지할 구독이 있을 때만 열리고, ①→②(→③)를 거치며 이벤트가 한 번씩 나간다
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MySubscription } from '@/features/subscription/api/subscription';

import { CancelFlowScreen } from './CancelFlowScreen';

const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
  back: vi.fn(),
  query: {
    subscription: null as MySubscription | null,
    isPending: false,
    isError: false,
  },
  learningLevel: { data: { learningLevel: 3 } },
}));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mocks.replace,
    push: mocks.push,
    back: mocks.back,
  }),
}));
vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContextSnapshot: () => null,
}));
vi.mock('@/features/subscription/model/useSubscriptionQuery', () => ({
  useSubscriptionQuery: () => mocks.query,
}));
vi.mock('@/features/onboarding/model/useLearningLevelQuery', () => ({
  useLearningLevelQuery: () => mocks.learningLevel,
}));
vi.mock('@/features/streak/api/streak', () => ({
  getStreakCalendar: async () => ({
    totalActiveDays: 12,
    longestStreakDays: 5,
    days: [],
  }),
}));

const premium = (overrides: Partial<MySubscription> = {}): MySubscription => ({
  premium: true,
  subscriptionStatus: 'ACTIVE',
  periodType: 'NORMAL',
  expiresAt: '2026-10-04T12:00:00',
  conversationCompletedSinceLaunch: true,
  productId: 'com.saynow.app.premium.monthly',
  ...overrides,
});

const renderScreen = (subscription: MySubscription | null) => {
  mocks.query = { subscription, isPending: false, isError: false };
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <CancelFlowScreen />
    </QueryClientProvider>,
  );
};

const chooseReason = (label: string) => {
  fireEvent.click(screen.getByRole('radio', { name: label }));
  fireEvent.click(screen.getByRole('button', { name: '다음' }));
};

beforeEach(() => {
  mocks.track.mockClear();
  mocks.replace.mockClear();
  mocks.push.mockClear();
});
afterEach(cleanup);

describe('열리는 조건', () => {
  it('해지 예약이면 사유를 묻지 않고 구독 관리로 돌려보낸다', () => {
    renderScreen(premium({ subscriptionStatus: 'CANCELED' }));

    expect(mocks.replace).toHaveBeenCalledWith('/me/subscription');
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('갱신되는 구독이면 사유 라디오 7개가 뜬다', () => {
    renderScreen(premium());

    expect(screen.getAllByRole('radio')).toHaveLength(7);
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});

describe('① 사유 선택', () => {
  it('고르기 전엔 다음이 눌리지 않는다', () => {
    renderScreen(premium());

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it('기타는 글을 적어야 다음이 살고, 적은 글이 이벤트와 다음 화면에 실린다', () => {
    renderScreen(premium());
    fireEvent.click(screen.getByRole('radio', { name: '기타' }));
    const next = screen.getByRole('button', { name: '다음' });
    expect(next).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: ' 발음 평가가 엄격해요 ' },
    });
    fireEvent.click(next);

    expect(mocks.track).toHaveBeenCalledWith('Cancel Reason Selected', {
      reason: 'other',
      other_text: '발음 평가가 엄격해요',
    });
    expect(screen.getByText('“발음 평가가 엄격해요”')).toBeInTheDocument();
  });

  it('"계속 이용할게요"는 이벤트 없이 구독 관리로 돌아간다', () => {
    renderScreen(premium());

    fireEvent.click(screen.getByRole('button', { name: '계속 이용할게요' }));

    expect(mocks.replace).toHaveBeenCalledWith('/me/subscription');
    expect(mocks.track).not.toHaveBeenCalled();
  });
});

describe('② 사유별 화면', () => {
  it('가격 부담이면 플랜에 맞는 화면이 뜨고 노출 이벤트에 플랜이 실린다', () => {
    renderScreen(premium());

    chooseReason('가격이 부담돼요');

    expect(screen.getByText('하루 500원')).toBeInTheDocument();
    expect(mocks.track).toHaveBeenCalledWith('Cancel Retention Viewed', {
      reason: 'price',
      plan: 'monthly',
    });
  });

  it('"조금 더 써볼게요"는 남았다는 이벤트를 남기고 구독 관리로 돌아간다', () => {
    renderScreen(premium());
    chooseReason('쓸 시간이 없어요');

    fireEvent.click(screen.getByRole('button', { name: '조금 더 써볼게요' }));

    expect(mocks.track).toHaveBeenCalledWith('Cancel Stay Tapped', {
      reason: 'time',
      to: 'manage',
    });
    expect(mocks.replace).toHaveBeenCalledWith('/me/subscription');
  });

  it('콘텐츠 부족의 주 버튼은 편지함 작성으로 보낸다', () => {
    renderScreen(premium());
    chooseReason('원하는 콘텐츠가 부족해요');

    fireEvent.click(
      screen.getByRole('button', { name: '원하는 상황 알려주기' }),
    );

    expect(mocks.track).toHaveBeenCalledWith('Cancel Stay Tapped', {
      reason: 'content',
      to: 'mailbox',
    });
    expect(mocks.push).toHaveBeenCalledWith('/mailbox/compose');
  });

  it('"그래도 해지하러 가기"는 스토어 링크이고 어느 사유에서 나갔는지 남긴다', () => {
    renderScreen(premium());
    chooseReason('앱이 불편하거나 오류가 있어요');

    const leave = screen.getByRole('link', { name: '그래도 해지하러 가기' });
    fireEvent.click(leave);

    expect(leave).toHaveAttribute(
      'href',
      'https://apps.apple.com/account/subscriptions',
    );
    expect(mocks.track).toHaveBeenCalledWith('Store Subscription Tapped', {
      status: 'active',
      action: 'cancel',
      reason: 'bug',
    });
  });
});

describe('다른 방법 → ③', () => {
  it('방법을 고르고 다음을 누르면 방법에 맞는 화면이 뜨고 이벤트 둘이 나간다', () => {
    renderScreen(premium());
    chooseReason('다른 방법으로 공부하려고요');
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();

    fireEvent.click(screen.getByRole('radio', { name: '유튜브 · 독학' }));
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(screen.getByText('본 표현을 말해 볼 차례예요')).toBeInTheDocument();
    expect(mocks.track).toHaveBeenCalledWith('Cancel Method Selected', {
      method: 'youtube',
    });
    expect(mocks.track).toHaveBeenCalledWith('Cancel Retention Viewed', {
      reason: 'other_method',
      method: 'youtube',
    });
  });

  it('③에서 뒤로 가면 방법 라디오로, 거기서 또 뒤로 가면 ①로 돌아간다', () => {
    renderScreen(premium());
    chooseReason('다른 방법으로 공부하려고요');
    fireEvent.click(screen.getByRole('radio', { name: '학원 · 과외' }));
    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));
    expect(
      screen.getByRole('heading', { name: /공부하실 예정이에요/ }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));
    expect(
      screen.getByRole('heading', { name: /이유를 알려주세요/ }),
    ).toBeInTheDocument();
  });
});
