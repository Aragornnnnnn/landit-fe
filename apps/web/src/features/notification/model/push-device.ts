// 이 앱 설치의 푸시 상태를 서버와 맞춘다 — 설치 ID를 보관하고, 현재 계정·OS 권한·셸 토큰을 설치 API로 보낸다
import { generateRandomHex } from '@/shared/auth/crypto';
import {
  getNativeContext,
  toApiPlatform,
} from '@/shared/bridge/native-context';

import {
  updatePushDevice,
  type PushDeviceUpdateRequest,
} from '../api/push-device';
import type { NotificationPermissionStatus } from './useNotificationPermission';

// 로그아웃·탈퇴로 지우지 않는다 — 계정이 바뀌어도 같은 설치여야 서버가 이전 계정의 연결을 교체한다
const INSTALLATION_ID_KEY = 'landit-installation-id';

// 서버가 UUID 형식(8-4-4-4-12)으로 받는다. crypto.randomUUID는 보안 컨텍스트 전용이라 http 로컬 웹(LAN IP)에선 없다
const createUuid = () =>
  generateRandomHex(16).replace(
    /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
    '$1-$2-$3-$4-$5',
  );

// 셸 안에서만 설치가 있다(브라우저면 null). 처음 부를 때 만들어 두고 이후엔 같은 값을 쓴다
export const getOrCreateInstallationId = (): string | null => {
  if (!getNativeContext()) return null;

  const saved = localStorage.getItem(INSTALLATION_ID_KEY);
  if (saved) return saved;

  const created = createUuid();
  localStorage.setItem(INSTALLATION_ID_KEY, created);
  return created;
};

const sendDeviceState = async (
  state: Omit<PushDeviceUpdateRequest, 'platform'>,
) => {
  const platform = getNativeContext()?.platform;
  const installationId = getOrCreateInstallationId();
  if (!platform || !installationId) return;

  await updatePushDevice(installationId, {
    platform: toApiPlatform(platform),
    ...state,
  });
};

// 권한이 있으면 토큰과 함께 활성, 없으면 비활성. 토큰을 기다리는 중이거나 권한을 알 수 없으면 보내지 않는다
export const syncPushDevice = async (
  permission: NotificationPermissionStatus,
  token: string | null,
) => {
  if (permission === 'unavailable') return;
  if (permission !== 'granted') {
    await sendDeviceState({ pushEnabled: false });
    return;
  }
  if (token) await sendDeviceState({ expoPushToken: token, pushEnabled: true });
};

// 탈퇴처럼 계정이 사라지기 전에 이 설치로 더는 보내지 않게 한다
export const disablePushDevice = () => sendDeviceState({ pushEnabled: false });
