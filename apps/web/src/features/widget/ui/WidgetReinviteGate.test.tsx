// WidgetReinviteGate — 재유도 시트를 띄울 조건과 답을 한 번으로 끝내는 계약 검증
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isConsentPromptDue } from '@/features/notification/model/consent-prompt';
import { useNotificationPermission } from '@/features/notification/model/useNotificationPermission';
import { getNativeContext } from '@/shared/bridge/native-context';
import { postToNative } from '@/shared/bridge/web-bridge';

import {
  markTalkCompletedForWidget,
  shouldReinvite,
} from '../model/install-prompt';
import { WidgetReinviteGate } from './WidgetReinviteGate';

vi.mock('motion/react', () => import('@/shared/motion/test-double'));

// next/image는 라우터 컨텍스트를 요구해 jsdom에서 못 그린다 — 자리표시로 바꾼다
vi.mock('next/image', () => ({ default: () => <span /> }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));
const pushMock = vi.fn();

vi.mock('@/shared/bridge/native-context');
const getNativeContextMock = vi.mocked(getNativeContext);

vi.mock('@/shared/bridge/web-bridge', () => ({ postToNative: vi.fn() }));
const postToNativeMock = vi.mocked(postToNative);

vi.mock('@/features/notification/model/consent-prompt');
const isConsentPromptDueMock = vi.mocked(isConsentPromptDue);

vi.mock('@/features/notification/model/useNotificationPermission');
const useNotificationPermissionMock = vi.mocked(useNotificationPermission);

const contextOf = (platform: 'ios' | 'android') => ({
  platform,
  appVersion: '1.2.0',
  buildNumber: '1',
  bridgeVersion: 2,
});

// 재유도를 물을 차례인 상태 — 오늘 대화를 막 마쳤고, 권한 회신이 왔고, 동의 차례가 아니다
const arrangeDue = (platform: 'ios' | 'android' = 'ios') => {
  getNativeContextMock.mockReturnValue(contextOf(platform));
  isConsentPromptDueMock.mockReturnValue(false);
  useNotificationPermissionMock.mockReturnValue('granted');
  markTalkCompletedForWidget();
};

beforeEach(() => localStorage.clear());

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('WidgetReinviteGate', () => {
  it('대화를 막 마친 사람에게 시트를 띄우고 차례를 소비한다', () => {
    arrangeDue();

    render(<WidgetReinviteGate />);

    expect(
      screen.getByText('오늘 열매, 홈에서도 보고 싶다면'),
    ).toBeInTheDocument();
    // 차례가 소비돼 다음 마운트에서는 뜨지 않는다
    expect(shouldReinvite()).toBe(false);
  });

  it('위젯 없는 환경(브라우저)에서는 띄우지 않는다', () => {
    arrangeDue();
    getNativeContextMock.mockReturnValue(null);

    render(<WidgetReinviteGate />);

    expect(screen.queryByText('오늘 열매, 홈에서도 보고 싶다면')).toBeNull();
  });

  it('권한 회신이 오기 전에는 띄우지도, 차례를 소비하지도 않는다 — 초기값으로 섣불리 판정하지 않는다', () => {
    arrangeDue();
    useNotificationPermissionMock.mockReturnValue('unavailable');

    render(<WidgetReinviteGate />);

    expect(screen.queryByText('오늘 열매, 홈에서도 보고 싶다면')).toBeNull();
    expect(shouldReinvite()).toBe(true);
  });

  it('알림 동의가 뜰 차례면 미룬다 — 차례를 소비하지 않아 다음 대화 뒤에 다시 온다', () => {
    arrangeDue();
    useNotificationPermissionMock.mockReturnValue('undetermined');
    isConsentPromptDueMock.mockReturnValue(true);

    render(<WidgetReinviteGate />);

    expect(screen.queryByText('오늘 열매, 홈에서도 보고 싶다면')).toBeNull();
    expect(shouldReinvite()).toBe(true);
  });

  it('미룬 판정은 고정된다 — 동의에 답해 권한이 바뀌어도 같은 방문에서 뒤늦게 뜨지 않는다', () => {
    arrangeDue();
    useNotificationPermissionMock.mockReturnValue('undetermined');
    isConsentPromptDueMock.mockReturnValue(true);
    const { rerender } = render(<WidgetReinviteGate />);

    // 동의 시트에 답해 권한이 확정되고 동의 차례도 끝난 상황
    useNotificationPermissionMock.mockReturnValue('granted');
    isConsentPromptDueMock.mockReturnValue(false);
    rerender(<WidgetReinviteGate />);

    expect(screen.queryByText('오늘 열매, 홈에서도 보고 싶다면')).toBeNull();
    expect(shouldReinvite()).toBe(true);
  });

  it('나중에 하기를 누르면 거절로 기록해 이후 다시 묻지 않는다', () => {
    arrangeDue();
    render(<WidgetReinviteGate />);

    fireEvent.click(screen.getByText('나중에 하기'));

    markTalkCompletedForWidget();
    expect(shouldReinvite()).toBe(false);
  });

  it('안드로이드에서 위젯 추가하기를 누르면 시스템 핀 다이얼로그를 청한다', () => {
    arrangeDue('android');
    render(<WidgetReinviteGate />);

    fireEvent.click(screen.getByText('위젯 추가하기'));

    expect(postToNativeMock).toHaveBeenCalledWith({
      type: 'REQUEST_WIDGET_PIN',
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('iOS에서 위젯 추가하기를 누르면 갤러리 여는 길 안내로 보낸다', () => {
    arrangeDue('ios');
    render(<WidgetReinviteGate />);

    fireEvent.click(screen.getByText('위젯 추가하기'));

    expect(pushMock).toHaveBeenCalledWith('/widget-install?start=guide');
    expect(postToNativeMock).not.toHaveBeenCalled();
  });
});
