// 다시 설치해도 유지되는 기기 ID를 읽는다 — iOS는 키체인에 넣어 둔 UUID, Android는 ANDROID_ID
import { Platform } from 'react-native';
import { getAndroidId } from 'expo-application';
import { randomUUID } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { reportWarning } from '@/monitoring/report';

const DEVICE_ID_KEY = 'landit.deviceId';

// 잠금 화면에서 깨어난 실행에서도 읽히게 첫 잠금 해제 뒤로 열고, 백업으로 다른 기기에 옮겨가지 않게 이 기기에만 둔다
const KEYCHAIN_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

// iOS 키체인 항목은 앱을 지워도 남아서 다시 설치해도 같은 ID가 나온다
const getIosDeviceId = () => {
  const saved = SecureStore.getItem(DEVICE_ID_KEY, KEYCHAIN_OPTIONS);
  if (saved) return saved;

  const created = randomUUID();
  SecureStore.setItem(DEVICE_ID_KEY, created, KEYCHAIN_OPTIONS);
  return created;
};

export const getDeviceId = (): string | undefined => {
  try {
    if (Platform.OS === 'android') return getAndroidId() || undefined;
    return getIosDeviceId();
  } catch (error) {
    reportWarning(error, { where: 'getDeviceId' });
    return undefined;
  }
};
