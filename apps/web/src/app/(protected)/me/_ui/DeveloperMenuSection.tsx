'use client';

// 내 정보 "개발자" 묶음 — ADMIN 계정에만 보인다. 알람 점검·프리미엄 온보딩 점검·환급 점검·튜토리얼·환급 페이월로 들어가고, 서버와 폰의 알람이 어긋났으면 여기서 바로 보인다
import { useAlarmSettingQuery } from '@/features/alarm/model/useAlarmSettingQuery';
import { useAlarmStatus } from '@/features/alarm/model/useAlarmStatus';
// 가로 import 사유: 투어 다시 보기는 투어 기능의 미리보기 스위치를 켜는 개발자 입구다
import { startTourPreview } from '@/features/tour/model/tour-preview';
import { useAuthStore } from '@/shared/auth/auth-store';
import { useIsAdmin } from '@/shared/auth/current-member';
import {
  ALARM_CHECK_PATH,
  PREMIUM_ONBOARDING_CHECK_PATH,
  REWARD_CHECK_PATH,
  REWARD_PAYWALL_CHECK_PATH,
  SCENARIO_PATH,
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
  const isAdmin = useIsAdmin();
  const userId = useAuthStore((state) => state.member?.userId ?? null);
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
        href={REWARD_CHECK_PATH}
        icon={<Emoji>💰</Emoji>}
        title="환급 점검"
        description="가짜 값으로 환급 화면과 동전 연출을 열어요"
      />
      <MenuLink
        href={SCENARIO_PATH}
        onClick={() => {
          if (userId !== null) startTourPreview(userId);
        }}
        icon={<Emoji>👋</Emoji>}
        title="튜토리얼 보기"
        description="첫 대화를 마친 뒤 홈에서 나오는 투어를 처음부터 봐요. 카드 뒤집기부터는 오늘 카드를 끝냈을 때 이어져요"
      />
      <MenuLink
        href={REWARD_PAYWALL_CHECK_PATH}
        icon={<Emoji>💳</Emoji>}
        title="환급 페이월 보기"
        description="혜택 화면과 결제 금액 안내를 결제 없이 열어요"
      />
    </MenuSection>
  );
};
