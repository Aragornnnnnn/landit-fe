// 대화 카드의 표시 기본값 — 마이페이지 설정을 따른다. 카드에서 바꾼 값은 그 카드에만 산다
import { useSyncExternalStore } from 'react';

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
  const alwaysShowText = useDisplaySetting('alwaysShowText');
  const translationDefaultOpen = useDisplaySetting('alwaysShowTranslation');

  return { textHidden: !alwaysShowText, translationDefaultOpen };
};
