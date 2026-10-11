// 알람 유저 속성 동기화 — 서버 설정을 받은 뒤에만 올리는지
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/shared/auth/auth-store';

import { AlarmPropertiesSync } from './AlarmPropertiesSync';

const mocks = vi.hoisted(() => ({
  setUserProperties: vi.fn(),
  setting: undefined as { time: string | null; enabled: boolean } | undefined,
}));
vi.mock('@/shared/analytics', () => ({
  setUserProperties: mocks.setUserProperties,
}));
vi.mock('../model/useAlarmSettingQuery', () => ({
  useAlarmSettingQuery: () => ({ data: mocks.setting }),
}));

const signIn = () =>
  useAuthStore.getState().setAuth('access', 'refresh', {
    userId: 1,
    nickname: '준서',
    email: null,
    provider: 'kakao',
  });

beforeEach(() => {
  mocks.setting = undefined;
});
afterEach(() => {
  cleanup();
  useAuthStore.getState().clearAuth();
});

describe('AlarmPropertiesSync', () => {
  it.each([
    ['등록해 둔 사람', true],
    ['등록하지 않은 사람', false],
  ])('%s의 설정을 받으면 그대로 올린다', (_case, enabled) => {
    signIn();
    mocks.setting = { time: '19:00', enabled };

    render(<AlarmPropertiesSync />);

    expect(mocks.setUserProperties).toHaveBeenCalledWith({
      has_alarm: enabled,
    });
  });

  it('설정을 받기 전에는 올리지 않는다 — 알람을 모르는 환경은 끝까지 속성이 없다', () => {
    signIn();

    render(<AlarmPropertiesSync />);

    expect(mocks.setUserProperties).not.toHaveBeenCalled();
  });

  it('로그인 전에는 올리지 않는다', () => {
    mocks.setting = { time: '19:00', enabled: true };

    render(<AlarmPropertiesSync />);

    expect(mocks.setUserProperties).not.toHaveBeenCalled();
  });
});
