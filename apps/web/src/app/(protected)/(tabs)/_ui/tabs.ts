// 탭 목록 — 셸이 그리는 칩과 각 탭의 주소를 한 곳에서 정한다
// ready가 false면 칩에 안 나온다. 라우트는 이미 있으니 콘텐츠가 준비되면 플래그만 뒤집으면 된다
import {
  SCENARIO_PATH,
  SMALLTALK_HISTORY_PATH,
  SMALLTALK_PATH,
} from '@/shared/lib/routes';

export interface Tab {
  href: string;
  label: string;
  ready: boolean;
  // 그 탭에서만 열리는 곁길. 탭 내용이 아니라 부가 목적지라 칩 줄 오른쪽 끝에 붙는다
  action?: { href: string; label: string };
}

export const TABS: Tab[] = [
  { href: SCENARIO_PATH, label: '시나리오', ready: true },
  {
    href: SMALLTALK_PATH,
    label: '스몰톡',
    ready: true,
    action: { href: SMALLTALK_HISTORY_PATH, label: '기록' },
  },
];

export const VISIBLE_TABS = TABS.filter((tab) => tab.ready);
