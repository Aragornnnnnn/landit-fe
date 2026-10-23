// 네이티브 컨텍스트를 읽어 앱 업데이트 정책을 조회한다 — BE updateType을 그대로 전달한다
import { getNativeContext, getSurface } from '@/shared/bridge/native-context';

import type { AppUpdateType } from '../api/app-update';
import { resolveAppUpdateRequest } from './resolveAppUpdateRequest';
import { useAppUpdateQuery } from './useAppUpdateQuery';

export const useAppUpdateCheck = (): {
  updateType: AppUpdateType;
  reason: string | null;
  /** 정책을 아직 묻는 중이다 — 그동안은 NONE으로 보이지만 FORCE로 바뀔 수 있다 */
  checking: boolean;
} => {
  const request = resolveAppUpdateRequest(getSurface(), getNativeContext());
  const { data, checking } = useAppUpdateQuery(request);

  if (!data) return { updateType: 'NONE', reason: null, checking };
  return { updateType: data.updateType, reason: data.reason, checking };
};
