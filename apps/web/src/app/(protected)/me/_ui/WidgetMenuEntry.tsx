'use client';

// 마이페이지 "홈 화면 위젯" 행 — 위젯이 실린 셸에서만 보이고, 누르면 설치 안내로 간다
import { supportsWidgetInstall } from '@/features/widget/model/install-prompt';
import { getNativeContextSnapshot } from '@/shared/bridge/native-context';
import { WIDGET_GUIDE_PATH } from '@/shared/lib/routes';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { LayoutGridIcon } from '@/shared/ui/Icons';

import { MenuLink } from './Menu';

export const WidgetMenuEntry = () => {
  // 셸 컨텍스트는 클라이언트에서만 — 서버 렌더와 첫 렌더를 맞추려고 그때까지는 브라우저로 본다
  const context = useClientOnlyValue(getNativeContextSnapshot, null);
  if (!supportsWidgetInstall(context)) return null;

  return (
    <MenuLink
      href={WIDGET_GUIDE_PATH}
      icon={<LayoutGridIcon size={22} />}
      title="홈 화면 위젯"
    />
  );
};
