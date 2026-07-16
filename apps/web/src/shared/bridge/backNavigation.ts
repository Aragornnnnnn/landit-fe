// 네이티브 뒤로가기(BACK_PRESSED)를 어떻게 처리할지 결정하는 순수 함수 — 화면 경로와 히스토리 상태로 판단
// 홈(최상위)에서는 이전 화면(대화·퀴즈)으로 돌아가지 않고 종료를 확인한다.

export type BackDecision = 'exit-confirm' | 'history-back' | 'exit-app';

// 뒤로가기가 앱 종료로 이어져야 하는 최상위 화면들. 여기선 history.back 대신 종료 확인을 띄운다.
const ROOT_PATHS = ['/home'];

export const decideBack = (
  pathname: string,
  canGoBack: boolean,
): BackDecision => {
  if (ROOT_PATHS.includes(pathname)) return 'exit-confirm';
  return canGoBack ? 'history-back' : 'exit-app';
};
