// 네이티브 컨텍스트를 읽어 앱 업데이트 정책을 조회한다 — BE updateType을 그대로 전달한다
import { getNativeContext, getSurface } from '@/shared/bridge/native-context';

import type { AppUpdateType } from '../api/app-update';
import { resolveAppUpdateRequest } from './resolveAppUpdateRequest';
import { useAppUpdateQuery } from './useAppUpdateQuery';

export const useAppUpdateCheck = (): {
  updateType: AppUpdateType;
  reason: string | null;
} => {
  const request = resolveAppUpdateRequest(getSurface(), getNativeContext());
  const { data } = useAppUpdateQuery(request);

  if (!data) return { updateType: 'NONE', reason: null };
  return { updateType: data.updateType, reason: data.reason };
};
