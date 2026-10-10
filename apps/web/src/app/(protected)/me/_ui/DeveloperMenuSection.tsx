'use client';

// 내 정보 "개발자" 묶음 — ADMIN 계정에만 보인다. 알람 점검·프리미엄 온보딩 점검·환급 점검으로 들어가고, 서버와 폰의 알람이 어긋났으면 여기서 바로 보인다
import { useAlarmSettingQuery } from '@/features/alarm/model/useAlarmSettingQuery';
import { useAlarmStatus } from '@/features/alarm/model/useAlarmStatus';
import { useAuthStore } from '@/shared/auth/auth-store';
import {
  ALARM_CHECK_PATH,
  PREMIUM_ONBOARDING_CHECK_PATH,
  REFUND_CHECK_PATH,
} from '@/shared/lib/routes';
import { Emoji } from '@/shared/ui/emoji';

import { compareWithServer } from '../_model/alarm-comparison';
import { MenuLink, MenuSection } from './Menu';

const AlarmCheckLink = () => {
  const status = useAlarmStatus();
  const { data: setting } = useAlarmSettingQuery();

  const sync = compareWithServer(setting, status);
  const description = !status
    ? '알람을 모르는 환경이에요'
    : sync.differs
      ? `폰 ${sync.phone} · 서버 ${sync.server} — 어긋났어요`
      : `이 폰 ${sync.phone}`;

  return (
    <MenuLink
      href={ALARM_CHECK_PATH}
      icon={<Emoji>⏰</Emoji>}
      title="알람 점검"
      description={description}
    />
  );
};

export const DeveloperMenuSection = () => {
  const isAdmin = useAuthStore((state) => state.member?.role === 'ADMIN');
  // ADMIN이 아니면 알람 상태를 묻지도 않는다
  if (!isAdmin) return null;

  return (
    <MenuSection title="개발자">
      <AlarmCheckLink />
      <MenuLink
        href={PREMIUM_ONBOARDING_CHECK_PATH}
        icon={<Emoji>🎉</Emoji>}
        title="프리미엄 온보딩 점검"
        description="결제 없이 케이스별로 열어요"
      />
      <MenuLink
        href={REFUND_CHECK_PATH}
        icon={<Emoji>💰</Emoji>}
        title="환급 점검"
        description="가짜 값으로 환급 화면과 동전 연출을 열어요"
      />
    </MenuSection>
  );
};
