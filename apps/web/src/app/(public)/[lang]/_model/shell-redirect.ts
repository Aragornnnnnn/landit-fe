// 앱 셸은 처음 켜질 때 루트(/)를 연다 — 셸 안이면 랜딩을 그리기 전에 홈으로 보내는 인라인 스크립트
import { SCENARIO_PATH } from '@/shared/lib/routes';

// 문자열로 바뀌어 모듈 밖에서 실행되므로 바깥 변수를 참조하지 않는다 (홈 주소는 인자로 받는다).
// ReactNativeWebView는 모든 셸 버전이 콘텐츠 로드 전에 심어 두므로 구 셸도 앱 업데이트 없이 걸린다
export const redirectShellToHome = (homePath: string) => {
  const w = window as {
    ReactNativeWebView?: unknown;
    __LANDIT_NATIVE__?: unknown;
  };
  if (!w.ReactNativeWebView && !w.__LANDIT_NATIVE__) return;
  document.documentElement.style.visibility = 'hidden';
  window.location.replace(homePath);
};

export const shellRedirectScript = `(${redirectShellToHome.toString()})(${JSON.stringify(SCENARIO_PATH)})`;
