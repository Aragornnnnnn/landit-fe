'use client';

// 마이페이지 "홈 화면 위젯" 행 — 위젯이 실린 셸에서만 보이고, 누르면 설치 안내로 간다
import { supportsWidgetInstall } from '@/features/widget/model/install-prompt';
import { useNativeContext } from '@/shared/bridge/useNativeContext';
import { WIDGET_GUIDE_PATH } from '@/shared/lib/routes';
import { Emoji } from '@/shared/ui/emoji';

import { MenuLink } from './Menu';

export const WidgetMenuEntry = () => {
  const context = useNativeContext();
  if (!supportsWidgetInstall(context)) return null;

  return (
    <MenuLink
      href={WIDGET_GUIDE_PATH}
      icon={<Emoji>🧩</Emoji>}
      title="홈 화면 위젯"
    />
  );
};
