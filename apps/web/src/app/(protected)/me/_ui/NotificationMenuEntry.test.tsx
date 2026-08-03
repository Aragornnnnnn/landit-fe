// NotificationMenuEntry — 알림을 안 켠 유저에게만 보이고, 권한 상태별로 다른 동작을 하는지 검증
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useNotificationPermission } from '@/features/notification/model/useNotificationPermission';
import { postToNative } from '@/shared/bridge/web-bridge';

import { NotificationMenuEntry } from './NotificationMenuEntry';

vi.mock('@/features/notification/model/useNotificationPermission');
const useNotificationPermissionMock = vi.mocked(useNotificationPermission);

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
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('NotificationMenuEntry', () => {
  it('권한이 미결정이면 알림 켜기가 보이고, 누르면 동의 프롬프트가 열린다', () => {
    useNotificationPermissionMock.mockReturnValue('undetermined');

    render(<NotificationMenuEntry />);
    fireEvent.click(screen.getByText('알림 켜기'));

    expect(screen.getByText('알림 받을게요!')).toBeInTheDocument();
  });

  it('이미 거부한 유저가 누르면 프롬프트 대신 OS 설정을 연다', () => {
    useNotificationPermissionMock.mockReturnValue('denied');

    render(<NotificationMenuEntry />);
    fireEvent.click(screen.getByText('알림 켜기'));

    expect(postToNativeMock).toHaveBeenCalledWith({ type: 'OPEN_SETTINGS' });
    expect(screen.queryByText('알림 받을게요!')).not.toBeInTheDocument();
  });

  it('이미 허용한 유저에겐 항목 자체가 안 보인다', () => {
    useNotificationPermissionMock.mockReturnValue('granted');

    render(<NotificationMenuEntry />);

    expect(screen.queryByText('알림 켜기')).not.toBeInTheDocument();
  });

  it('권한 상태를 알 수 없는 환경(브라우저·구버전 셸)에선 안 보인다', () => {
    useNotificationPermissionMock.mockReturnValue('unavailable');

    render(<NotificationMenuEntry />);

    expect(screen.queryByText('알림 켜기')).not.toBeInTheDocument();
  });
});
