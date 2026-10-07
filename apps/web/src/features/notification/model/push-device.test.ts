// push-device — 설치 ID 보관과 권한·토큰에 따른 설치 동기화 계약 검증
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getNativeContext } from '@/shared/bridge/native-context';

import { updatePushDevice } from '../api/push-device';
import {
  disablePushDevice,
  getOrCreateInstallationId,
  readInstallationId,
  syncPushDevice,
} from './push-device';

vi.mock('@/shared/bridge/native-context', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getNativeContext: vi.fn(() => null),
}));
const getNativeContextMock = vi.mocked(getNativeContext);

vi.mock('../api/push-device', () => ({ updatePushDevice: vi.fn() }));
const updatePushDeviceMock = vi.mocked(updatePushDevice);

const nativeContext = (platform: 'ios' | 'android') => ({
  platform,
  appVersion: '1.3.2',
  buildNumber: '11',
  bridgeVersion: 6,
});

const TOKEN = 'ExponentPushToken[abc]';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

beforeEach(() => {
  getNativeContextMock.mockReturnValue(nativeContext('ios'));
});

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('getOrCreateInstallationId', () => {
  it('처음 읽으면 UUID를 만들어 두고 다음에도 같은 값을 돌려준다', () => {
    const first = getOrCreateInstallationId();

    expect(first).toMatch(UUID_PATTERN);
    expect(getOrCreateInstallationId()).toBe(first);
  });

  it('셸 밖(브라우저)이면 설치가 없어 null이고 아무것도 저장하지 않는다', () => {
    getNativeContextMock.mockReturnValue(null);

    expect(getOrCreateInstallationId()).toBeNull();
    expect(localStorage.length).toBe(0);
  });
});

describe('readInstallationId', () => {
  it('만든 적이 없으면 null이고 새로 만들지 않는다 — 로그아웃은 서버가 모르는 ID를 보낼 이유가 없다', () => {
    expect(readInstallationId()).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('만들어 둔 설치 ID를 그대로 돌려준다', () => {
    const created = getOrCreateInstallationId();

    expect(readInstallationId()).toBe(created);
  });
});

describe('syncPushDevice', () => {
  it.each([
    ['ios', 'IOS'],
    ['android', 'ANDROID'],
  ] as const)(
    '권한이 있고 토큰이 오면 %s 설치를 %s 활성으로 등록한다',
    async (os, api) => {
      getNativeContextMock.mockReturnValue(nativeContext(os));

      await syncPushDevice('granted', TOKEN);

      expect(updatePushDeviceMock).toHaveBeenCalledWith(
        getOrCreateInstallationId(),
        {
          platform: api,
          expoPushToken: TOKEN,
          pushEnabled: true,
        },
      );
    },
  );

  it.each(['denied', 'undetermined'] as const)(
    'OS 권한이 %s면 토큰 없이 비활성으로 보낸다',
    async (permission) => {
      await syncPushDevice(permission, TOKEN);

      expect(updatePushDeviceMock).toHaveBeenCalledWith(
        getOrCreateInstallationId(),
        {
          platform: 'IOS',
          pushEnabled: false,
        },
      );
    },
  );

  it('권한은 있는데 토큰이 아직 안 왔으면 보내지 않는다 — 셸이 곧 토큰을 보낸다', async () => {
    await syncPushDevice('granted', null);

    expect(updatePushDeviceMock).not.toHaveBeenCalled();
  });

  it('권한 체계를 못 쓰는 환경(구버전 셸)이면 보내지 않는다', async () => {
    await syncPushDevice('unavailable', TOKEN);

    expect(updatePushDeviceMock).not.toHaveBeenCalled();
  });

  it('셸 밖(브라우저)이면 보내지 않는다 — 등록할 설치가 없다', async () => {
    getNativeContextMock.mockReturnValue(null);

    await syncPushDevice('granted', TOKEN);

    expect(updatePushDeviceMock).not.toHaveBeenCalled();
  });
});

describe('disablePushDevice', () => {
  it('이 설치를 비활성으로 보낸다', async () => {
    await disablePushDevice();

    expect(updatePushDeviceMock).toHaveBeenCalledWith(
      getOrCreateInstallationId(),
      {
        platform: 'IOS',
        pushEnabled: false,
      },
    );
  });
});
