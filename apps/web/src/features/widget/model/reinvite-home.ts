// 대화를 마치고 홈으로 나가는 길 — 위젯 재유도 자격이면 설치 안내(/widget-install)를 한 번 거쳐 가게 목적지를 정한다.
// 안내 화면은 끝난 뒤 여기 넘긴 home으로 이어 보낸다 (next 파라미터).
import { getNativeContext } from '@/shared/bridge/native-context';
import { WIDGET_INSTALL_PATH } from '@/shared/lib/routes';

import { shouldReinviteInstall, supportsWidgetInstall } from './install-prompt';

export const homeOrReinvitePath = (home: string): string =>
  supportsWidgetInstall(getNativeContext()) && shouldReinviteInstall()
    ? `${WIDGET_INSTALL_PATH}?next=${encodeURIComponent(home)}`
    : home;
