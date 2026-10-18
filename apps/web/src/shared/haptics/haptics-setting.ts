// 진동 켬/끔 설정 — 마이페이지 토글이 바꾸고 haptic()이 읽는다. 기본은 켬이라 "껐다"만 기기에 남긴다
import { deviceSetting } from '@/shared/lib/device-setting';

const hapticsEnabled = deviceSetting<boolean>({
  key: 'landit-haptics-off',
  defaultValue: true,
  // 키가 있으면 껐다는 뜻이다
  parse: () => false,
  serialize: () => '1',
});

/** 진동이 켜져 있는가. 저장소를 못 읽으면 켠 것으로 본다 */
export const isHapticsEnabled = hapticsEnabled.get;

export const setHapticsEnabled = hapticsEnabled.set;

export const subscribeHapticsSetting = hapticsEnabled.subscribe;
