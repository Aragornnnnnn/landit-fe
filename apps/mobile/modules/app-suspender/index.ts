// 앱을 홈 화면으로 내리는 네이티브 모듈 — iOS에만 존재한다 (안드로이드엔 이 파일이 노출하는 no-op)
import { requireOptionalNativeModule } from 'expo';

interface AppSuspenderModule {
  // 사용자가 홈 버튼을 누른 것처럼 앱을 백그라운드로 내린다
  goHome(): void;
}

const module = requireOptionalNativeModule<AppSuspenderModule>('AppSuspender');

// 모듈이 없는 플랫폼·환경(안드로이드·Expo Go)에서는 조용히 무시한다
export const goHome = (): void => module?.goHome();
