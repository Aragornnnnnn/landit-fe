// 네이티브 뒤로가기(BACK_PRESSED)를 어떻게 처리할지 결정하는 순수 함수 — 화면 경로와 히스토리 상태로 판단
// 탭 화면(최상위)에서는 이전 화면(대화·퀴즈)으로 돌아가지 않고 이중탭 종료 안내(토스트)로 처리한다.
import { SCENARIO_PATH, SMALLTALK_PATH } from '@/shared/lib/routes';

export type BackDecision = 'confirm-exit' | 'history-back' | 'exit-app';

// 뒤로가기가 앱 종료 흐름(이중탭 안내)으로 이어져야 하는 최상위 화면들 — 탭이 늘면 여기에 더한다
const ROOT_PATHS: string[] = [SCENARIO_PATH, SMALLTALK_PATH];

export const decideBack = (
  pathname: string,
  canGoBack: boolean,
): BackDecision => {
  if (ROOT_PATHS.includes(pathname)) return 'confirm-exit';
  return canGoBack ? 'history-back' : 'exit-app';
};
