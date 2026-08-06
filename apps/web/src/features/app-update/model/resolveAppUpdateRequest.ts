// 네이티브 컨텍스트로 업데이트 체크 요청을 만든다 — 브라우저거나 구버전 셸(빌드번호 없음)이면 체크를 건너뛴다
import type { NativeContext } from '@landit/bridge';

import {
  toApiPlatform,
  type AppPlatform,
  type Surface,
} from '@/shared/bridge/native-context';

export interface AppUpdateRequest {
  platform: AppPlatform;
  versionName: string;
  buildNumber: number;
}

// BE가 받는 버전명 형식 — 어긋나면 400이라 요청 전에 거른다
const VERSION_NAME_PATTERN = /^\d+\.\d+\.\d+$/;

export const resolveAppUpdateRequest = (
  surface: Surface,
  nativeContext: NativeContext | null,
): AppUpdateRequest | null => {
  if (surface !== 'app' || !nativeContext || !nativeContext.buildNumber) {
    return null;
  }
  if (!VERSION_NAME_PATTERN.test(nativeContext.appVersion)) {
    return null;
  }
  return {
    platform: toApiPlatform(nativeContext.platform),
    versionName: nativeContext.appVersion,
    buildNumber: Number(nativeContext.buildNumber),
  };
};
