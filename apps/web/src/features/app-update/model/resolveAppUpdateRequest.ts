// 네이티브 컨텍스트로 업데이트 체크 요청을 만든다 — 브라우저거나 구버전 셸(빌드번호 없음)이면 체크를 건너뛴다
import type { NativeContext } from '@landit/bridge';

import type { AppPlatform } from '@/features/app-update/api/app-update';
import type { Surface } from '@/shared/bridge/native-context';

export interface AppUpdateRequest {
  platform: AppPlatform;
  buildNumber: number;
}

const toApiPlatform = (platform: NativeContext['platform']): AppPlatform =>
  platform === 'ios' ? 'IOS' : 'ANDROID';

export const resolveAppUpdateRequest = (
  surface: Surface,
  nativeContext: NativeContext | null,
): AppUpdateRequest | null => {
  if (surface !== 'app' || !nativeContext || !nativeContext.buildNumber) {
    return null;
  }
  return {
    platform: toApiPlatform(nativeContext.platform),
    buildNumber: Number(nativeContext.buildNumber),
  };
};
