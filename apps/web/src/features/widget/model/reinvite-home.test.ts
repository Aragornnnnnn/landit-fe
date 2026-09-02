// reinvite-home — 대화 후 홈으로 나갈 때 위젯 재유도로 우회할지, 목적지 계약 검증
import type { NativeContext } from '@landit/bridge';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getNativeContext } from '@/shared/bridge/native-context';

import {
  recordInstallAccepted,
  recordInstallInvited,
  recordReinvited,
} from './install-prompt';
import { homeOrReinvitePath } from './reinvite-home';

vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContext: vi.fn(),
}));

const appContext: NativeContext = {
  platform: 'ios',
  appVersion: '1.2.0',
  buildNumber: '1',
  bridgeVersion: 2,
};

const HOME = '/scenario';

beforeEach(() => {
  localStorage.clear();
  vi.mocked(getNativeContext).mockReturnValue(appContext);
});

describe('homeOrReinvitePath — 자격 있을 때만 설치 안내를 거쳐 홈으로', () => {
  it('온보딩 유도는 봤지만 설치 안 한 사람은 안내(/widget-install)를 거쳐 간다', () => {
    recordInstallInvited();

    expect(homeOrReinvitePath(HOME)).toBe(
      `/widget-install?next=${encodeURIComponent(HOME)}`,
    );
  });

  it('온보딩 유도를 본 적 없으면 그냥 홈으로 (재유도는 유도를 본 사람만)', () => {
    expect(homeOrReinvitePath(HOME)).toBe(HOME);
  });

  it('이미 설치 길로 들어간 사람은 다시 붙잡지 않는다', () => {
    recordInstallInvited();
    recordInstallAccepted();

    expect(homeOrReinvitePath(HOME)).toBe(HOME);
  });

  it('재유도를 한 번 띄운 뒤엔 그냥 홈으로', () => {
    recordInstallInvited();
    recordReinvited();

    expect(homeOrReinvitePath(HOME)).toBe(HOME);
  });

  it('브라우저(셸 밖)에서는 재유도하지 않는다', () => {
    recordInstallInvited();
    vi.mocked(getNativeContext).mockReturnValue(null);

    expect(homeOrReinvitePath(HOME)).toBe(HOME);
  });
});
