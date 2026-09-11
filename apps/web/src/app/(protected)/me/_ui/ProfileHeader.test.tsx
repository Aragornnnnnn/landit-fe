// ProfileHeader — 이름·로그인 계정과 학습 수준의 마법사 래디를 보여주고, 수준을 모르면 기본 래디만 세운다. 결제가 안 열린 환경에선 마법사·레벨을 숨긴다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfileHeader } from './ProfileHeader';

const mocks = vi.hoisted(() => ({
  member: null as {
    nickname: string;
    email: string | null;
    provider: string;
  } | null,
  learningLevel: null as number | null,
  pending: false,
  // 결제 브릿지가 실린 셸 — null이면 브라우저(결제 전). 스냅샷은 같은 객체를 돌려줘야 한다(useSyncExternalStore)
  context: { appVersion: '1.3.0' } as { appVersion: string } | null,
}));
vi.mock('@/features/subscription/model/payment-flag', () => ({
  PAYMENT_ENABLED: true,
}));
vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContextSnapshot: () => mocks.context,
}));
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: mocks.member }),
}));
vi.mock('@/features/onboarding/model/useLearningLevelQuery', () => ({
  useLearningLevelQuery: () => ({
    data: { learningLevel: mocks.learningLevel },
    isPending: mocks.pending,
  }),
}));
// 그림 미리 받기는 자기 테스트가 있다 — 여기선 화면 계약만 본다
vi.mock('@/shared/lib/preload-next-images', () => ({ preloadImages: vi.fn() }));
vi.mock('next/image', () => ({
  // 어느 그림을 골랐는지만 보면 되니 평범한 img로 — 최적화 경고는 테스트라 무관하다
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src }: { src: string }) => <img alt="" src={src} />,
}));

beforeEach(() => {
  mocks.member = {
    nickname: '준서',
    email: 'junseo@example.com',
    provider: 'KAKAO',
  };
  mocks.learningLevel = 3;
  mocks.pending = false;
  mocks.context = { appVersion: '1.3.0' };
});
afterEach(() => cleanup());

describe('ProfileHeader', () => {
  it('이름과 이메일, 학습 수준의 마법사 래디와 레벨 이름을 보여준다', () => {
    render(<ProfileHeader />);

    expect(screen.getByText('준서')).toBeInTheDocument();
    expect(screen.getByText('junseo@example.com')).toBeInTheDocument();
    expect(screen.getByText('견습 마법사 Lv.3')).toBeInTheDocument();
    expect(screen.getByRole('presentation', { hidden: true })).toHaveAttribute(
      'src',
      '/images/character/level-wizard-3.webp',
    );
  });

  it('로그인한 곳을 로고 대신 이름 글자로 이메일 앞에 적는다', () => {
    render(<ProfileHeader />);

    expect(screen.getByText('카카오')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeNull();
  });

  it('모르는 로그인 방식이면 이메일만 적는다', () => {
    mocks.member = {
      nickname: '준서',
      email: 'junseo@example.com',
      provider: 'NAVER',
    };
    render(<ProfileHeader />);

    expect(screen.getByText('junseo@example.com')).toBeInTheDocument();
    expect(screen.queryByText('·')).not.toBeInTheDocument();
  });

  it('학습 수준을 아직 모르면 레벨 글자 없이 기본 래디만 선다', () => {
    mocks.learningLevel = null;
    render(<ProfileHeader />);

    expect(screen.queryByText(/마법사/)).not.toBeInTheDocument();
    expect(screen.getByRole('presentation', { hidden: true })).toHaveAttribute(
      'src',
      '/images/character/landy-normal.webp',
    );
  });

  it('수준을 받는 동안은 그림을 그리지 않는다 — 기본 래디가 레벨 래디로 바뀌는 깜빡임을 막는다', () => {
    mocks.pending = true;
    render(<ProfileHeader />);
    expect(
      screen.queryByRole('presentation', { hidden: true }),
    ).not.toBeInTheDocument();
  });

  it('로그인 제공자를 모르면 배지 없이 이메일만 쓴다', () => {
    mocks.member = {
      nickname: '준서',
      email: 'junseo@example.com',
      provider: 'naver',
    };
    render(<ProfileHeader />);
    expect(screen.getByText('junseo@example.com')).toBeInTheDocument();
  });

  it('닉네임이 없으면 게스트로 부르고, 이메일이 없으면 계정 줄을 뺀다', () => {
    mocks.member = { nickname: '  ', email: null, provider: 'APPLE' };
    render(<ProfileHeader />);

    expect(screen.getByText('게스트')).toBeInTheDocument();
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });

  it('결제가 안 열린 환경(브라우저·구버전 셸)에서는 마법사와 레벨을 숨기고 이름·계정만 보여준다', () => {
    mocks.context = null;
    render(<ProfileHeader />);

    expect(screen.getByText('준서')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(/Lv\./)).not.toBeInTheDocument();
  });
});
