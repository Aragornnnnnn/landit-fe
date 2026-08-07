// 탭 목록 — 셸이 그리는 칩과 각 탭의 주소를 한 곳에서 정한다
// ready가 false면 칩에 안 나온다. 라우트는 이미 있으니 콘텐츠가 준비되면 플래그만 뒤집으면 된다
import { SCENARIO_PATH, SMALLTALK_PATH } from '@/shared/lib/routes';

export interface Tab {
  href: string;
  label: string;
  ready: boolean;
}

export const TABS: Tab[] = [
  { href: SCENARIO_PATH, label: '시나리오', ready: true },
  { href: SMALLTALK_PATH, label: '스몰톡', ready: false },
];

export const VISIBLE_TABS = TABS.filter((tab) => tab.ready);
