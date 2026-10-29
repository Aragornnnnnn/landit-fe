// 기기 선호 언어 목록 — 셸이 넘긴 목록이 먼저, 없으면(브라우저·구 셸) navigator.languages
import { getNativeContext } from '@/shared/bridge/native-context';

/** iOS WebView의 navigator.languages는 첫 언어만 줄 수 있어, 셸이 넘긴 목록이 있으면 그쪽을 믿는다 */
export const deviceLanguages = (): readonly string[] => {
  const shellLanguages = getNativeContext()?.languages;
  return shellLanguages?.length ? shellLanguages : (navigator.languages ?? []);
};
