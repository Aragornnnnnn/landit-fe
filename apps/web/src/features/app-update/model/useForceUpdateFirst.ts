// 강제 업데이트가 화면의 1순위다 — 강제 업데이트거나 그럴지 아직 모르는 동안엔 다른 자동 안내(램프·공지·시트)를 띄우지 않는다
import { useAppUpdateCheck } from './useAppUpdateCheck';

export const useForceUpdateFirst = () => {
  const { updateType, checking } = useAppUpdateCheck();
  return checking || updateType === 'FORCE';
};
