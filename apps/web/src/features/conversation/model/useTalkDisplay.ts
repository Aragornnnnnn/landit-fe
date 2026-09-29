// 대화 한 번의 표시 상태 — 마이페이지 기본값으로 시작하고, 눈 아이콘으로 바꾼 값은 이 대화에서만 산다
import { useState, useSyncExternalStore } from 'react';

import {
  getDefaultDisplaySetting,
  getDisplaySetting,
  subscribeDisplaySettings,
  type DisplaySettingKey,
} from './talk-display';

/** 저장된 기본값 하나를 구독한다 — 대화 화면과 마이페이지가 같이 쓴다 */
export const useDisplaySetting = (key: DisplaySettingKey) =>
  useSyncExternalStore(
    subscribeDisplaySettings,
    () => getDisplaySetting(key),
    () => getDefaultDisplaySetting(key),
  );

export const useTalkDisplay = () => {
  const hideText = useDisplaySetting('hideText');
  const translationDefaultOpen = useDisplaySetting('alwaysShowTranslation');
  // 눈 아이콘을 누르기 전엔 null — 그동안은 기본값을 따른다
  const [textHiddenOverride, setTextHidden] = useState<boolean | null>(null);

  return {
    textHidden: textHiddenOverride ?? hideText,
    setTextHidden,
    translationDefaultOpen,
  };
};
