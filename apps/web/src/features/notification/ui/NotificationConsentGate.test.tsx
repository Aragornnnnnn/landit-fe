// NotificationConsentGate — 뜨는 조건과 첫 1회 풀스크린/이후 바텀시트 분기 검증
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { postToNative } from '@/shared/bridge/web-bridge';

import { CONSENT_PROMPT_SEEN_KEY } from '../model/consent-prompt';
import { useNotificationPermission } from '../model/useNotificationPermission';
import { NotificationConsentGate } from './NotificationConsentGate';

const mocks = vi.hoisted(() => ({ pathname: '/scenario' }));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock('../model/useNotificationPermission');
const useNotificationPermissionMock = vi.mocked(useNotificationPermission);

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: vi.fn(() => true),
}));
const postToNativeMock = vi.mocked(postToNative);

// motion 애니메이션(BottomSheet)을 순수 DOM으로 치환 — 렌더러 아이덴티티 문제 회피
vi.mock('motion/react', async () => {
  const { createElement, Fragment } = await import('react');
  const MOTION_PROPS = new Set([
    'initial',
    'animate',
    'exit',
    'transition',
    'drag',
    'dragConstraints',
    'dragElastic',
    'onDragEnd',
  ]);
  const motion = new Proxy(
    {},
    {
      get:
        (_target, tag: string) =>
        ({ children, ...props }: Record<string, unknown>) =>
          createElement(
            tag,
            Object.fromEntries(
              Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key)),
            ),
            children as React.ReactNode,
          ),
    },
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      createElement(Fragment, null, children),
    useReducedMotion: () => false,
  };
});

beforeEach(() => {
  localStorage.clear();
  mocks.pathname = '/scenario';
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('NotificationConsentGate', () => {
  it('본 적이 없으면 풀스크린 프롬프트를 띄운다', () => {
    useNotificationPermissionMock.mockReturnValue('undetermined');

    render(<NotificationConsentGate />);

    expect(screen.getByText('나중에 할게요')).toBeInTheDocument();
  });

  it('풀스크린을 본 적 있으면 바텀시트를 띄운다', () => {
    useNotificationPermissionMock.mockReturnValue('undetermined');
    localStorage.setItem(CONSENT_PROMPT_SEEN_KEY, '1');

    render(<NotificationConsentGate />);

    expect(screen.getByText('다음에 할게요')).toBeInTheDocument();
    expect(screen.queryByText('나중에 할게요')).not.toBeInTheDocument();
  });

  it.each([['granted'], ['denied'], ['unavailable']] as const)(
    '권한이 미결정이 아니면(%s) 띄우지 않는다',
    (permission) => {
      useNotificationPermissionMock.mockReturnValue(permission);

      render(<NotificationConsentGate />);

      expect(screen.queryByText('알림 받을게요!')).not.toBeInTheDocument();
    },
  );

  it('홈이 아닌 화면에선 띄우지 않는다', () => {
    useNotificationPermissionMock.mockReturnValue('undetermined');
    mocks.pathname = '/onboarding';

    render(<NotificationConsentGate />);

    expect(screen.queryByText('알림 받을게요!')).not.toBeInTheDocument();
  });

  it('나중에 할게요를 누르면 권한 요청 없이 닫히고, 풀스크린 소진이 기록된다', () => {
    useNotificationPermissionMock.mockReturnValue('undetermined');

    render(<NotificationConsentGate />);
    fireEvent.click(screen.getByText('나중에 할게요'));

    expect(screen.queryByText('알림 받을게요!')).not.toBeInTheDocument();
    expect(localStorage.getItem(CONSENT_PROMPT_SEEN_KEY)).not.toBeNull();
    expect(postToNativeMock).not.toHaveBeenCalled();
  });

  it('알림 받을게요를 누르면 권한 요청을 보내고 닫힌다', () => {
    useNotificationPermissionMock.mockReturnValue('undetermined');

    render(<NotificationConsentGate />);
    fireEvent.click(screen.getByText('알림 받을게요!'));

    expect(postToNativeMock).toHaveBeenCalledWith({
      type: 'REQUEST_NOTIFICATION_PERMISSION',
    });
    expect(screen.queryByText('알림 받을게요!')).not.toBeInTheDocument();
    expect(localStorage.getItem(CONSENT_PROMPT_SEEN_KEY)).not.toBeNull();
  });
});
