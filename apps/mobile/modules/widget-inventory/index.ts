// 홈 화면에 놓인 우리 위젯 목록을 조회하는 네이티브 모듈 — iOS에만 존재한다 (안드로이드엔 이 파일이 노출하는 빈 목록)
import { requireOptionalNativeModule } from 'expo';

interface WidgetInventoryModule {
  // 놓인 위젯 하나당 크기 이름 하나 (small/medium/large, 우리가 안 만든 크기는 other)
  getInstalledFamilies(): Promise<string[]>;
}

const module =
  requireOptionalNativeModule<WidgetInventoryModule>('WidgetInventory');

// 모듈이 없는 플랫폼·환경(안드로이드·Expo Go)에서는 조회할 것이 없다
export const getInstalledWidgetFamilies = (): Promise<string[]> =>
  module?.getInstalledFamilies() ?? Promise.resolve([]);
