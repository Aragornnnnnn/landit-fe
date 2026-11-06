// 로그인 버튼 목록과 순서 — 카카오는 한국 서비스라 일본어 화면에서는 지난번에 쓴 사람에게만 맨 아래에 남긴다
import type { Locale } from '@/shared/i18n/locale';

import type { SocialProvider } from './useSocialLogin';

/**
 * @param android 안드로이드면 애플 로그인을 두지 않는다
 * @param lastProvider 이 기기에서 마지막으로 로그인한 방법. 모르면 null
 */
export const loginProvidersOf = ({
  locale,
  android,
  lastProvider,
}: {
  locale: Locale;
  android: boolean;
  lastProvider: SocialProvider | null;
}): SocialProvider[] => {
  const global: SocialProvider[] = android ? ['google'] : ['google', 'apple'];
  if (locale === 'ko') return ['kakao', ...global];
  return lastProvider === 'kakao' ? [...global, 'kakao'] : global;
};
