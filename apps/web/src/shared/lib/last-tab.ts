// 마지막으로 보던 탭 — 홈에서 밀려 올라온 화면(스트릭·내 정보·편지함)이 뒤로 갈 때 돌아갈 곳.
// 탭에 있는 동안 기억해 두고, 나갈 때 읽는다. 기억이 없으면(딥링크 진입 등) 시나리오 탭이 정본이다.
// 세션 저장소를 쓴다 — 앱을 다시 켜면 처음부터라, "지난번 마지막 탭"이 아니라 "이번에 보던 탭"만 기억한다
import { SCENARIO_PATH, SMALLTALK_PATH } from './routes';

// 돌아갈 수 있는 곳은 탭 최상위뿐이다. 탭이 늘면 여기에 더한다
const TAB_PATHS: readonly string[] = [SCENARIO_PATH, SMALLTALK_PATH];

const STORAGE_KEY = 'landit:last-tab';

/** 이 주소를 "돌아갈 탭"으로 기억해도 되는가. 탭이 아니면 null */
export const toRememberedTab = (pathname: string) =>
  TAB_PATHS.includes(pathname) ? pathname : null;

/** 기억한 값으로 돌아갈 주소를 정한다. 없거나 모르는 값이면 시나리오 탭 */
export const resolveHomePath = (remembered: string | null) =>
  remembered && TAB_PATHS.includes(remembered) ? remembered : SCENARIO_PATH;

/** 지금 보고 있는 탭을 기억한다. 탭이 아닌 주소는 무시한다 */
export const rememberTab = (pathname: string) => {
  const tab = toRememberedTab(pathname);
  if (tab) sessionStorage.setItem(STORAGE_KEY, tab);
};

/** 밀려 올라온 화면이 뒤로 갈 주소 — 마지막으로 보던 탭, 없으면 시나리오 탭 */
export const homePath = () =>
  resolveHomePath(sessionStorage.getItem(STORAGE_KEY));
