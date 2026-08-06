// NotificationConsentGate — 알림을 청할 수 있는 조건과 한 번으로 끝내는 계약 검증
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { postToNative } from '@/shared/bridge/web-bridge';

import { CONSENT_PROMPT_SEEN_KEY } from '../model/consent-prompt';
import { useNotificationPermission } from '../model/useNotificationPermission';
import { NotificationConsentGate } from './NotificationConsentGate';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));

vi.mock('../model/useNotificationPermission');
const useNotificationPermissionMock = vi.mocked(useNotificationPermission);

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: vi.fn(() => true),
}));
const postToNativeMock = vi.mocked(postToNative);

beforeEach(() => localStorage.clear());

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('NotificationConsentGate', () => {
  it('아직 물어본 적 없고 권한이 미결정이면 시트를 띄운다', () => {
    useNotificationPermissionMock.mockReturnValue('undetermined');

    render(<NotificationConsentGate />);

    expect(screen.getByText('알림 받을게요!')).toBeInTheDocument();
  });

  it('이미 물어본 적 있으면 다시 띄우지 않는다', () => {
    // Given 지난번에 한 번 청했고 그때 켜지 않은 상태에서
    useNotificationPermissionMock.mockReturnValue('undetermined');
    localStorage.setItem(CONSENT_PROMPT_SEEN_KEY, '1');

    // When 다시 청할 자리에 서면
    render(<NotificationConsentGate />);

    // Then 조르지 않는다 — 남은 통로는 마이페이지뿐이다
    expect(screen.queryByText('알림 받을게요!')).not.toBeInTheDocument();
  });

  it.each([['granted'], ['denied'], ['unavailable']] as const)(
    '권한이 미결정이 아니면(%s) 띄우지 않는다',
    (permission) => {
      useNotificationPermissionMock.mockReturnValue(permission);

      render(<NotificationConsentGate />);

      expect(screen.queryByText('알림 받을게요!')).not.toBeInTheDocument();
    },
  );

  it('다음에 할게요를 누르면 권한 요청 없이 닫히고, 물어본 것으로 남는다', () => {
    useNotificationPermissionMock.mockReturnValue('undetermined');

    render(<NotificationConsentGate />);
    fireEvent.click(screen.getByText('다음에 할게요'));

    expect(screen.queryByText('알림 받을게요!')).not.toBeInTheDocument();
    expect(postToNativeMock).not.toHaveBeenCalled();
    expect(localStorage.getItem(CONSENT_PROMPT_SEEN_KEY)).not.toBeNull();
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
