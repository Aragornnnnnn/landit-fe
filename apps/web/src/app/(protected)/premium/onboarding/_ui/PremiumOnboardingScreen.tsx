'use client';

// 프리미엄 온보딩 — 결제 직후 환영 → 알람 등록 → 원래 가던 곳. 알람을 모르는 셸(브라우저·구 셸)이면 환영만 보고 바로 간다.
// 이동은 전부 replace — 끝난 뒤 뒤로 가기로 환영·페이월에 돌아오지 않게
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { parseAlarmTime } from '@/features/alarm/model/alarm-time';
import { isAlarmShell } from '@/features/alarm/model/shell-alarm';
import { useAlarmSettingQuery } from '@/features/alarm/model/useAlarmSettingQuery';
import { useAlarmStatus } from '@/features/alarm/model/useAlarmStatus';
import { AlarmSetupFlow } from '@/features/alarm/ui/AlarmSetupFlow';
import { preloadIntroPreview } from '@/features/alarm/ui/LockScreenPreview';
import { subscriptionKeys } from '@/features/subscription/model/my-subscription/keys';
import { useAuthStore } from '@/shared/auth/auth-store';
import { homePath } from '@/shared/lib/last-tab';

import { PremiumWelcome } from './PremiumWelcome';

export const PremiumOnboardingScreen = ({
  returnTo,
}: {
  returnTo?: string;
}) => {
  const router = useRouter();
  const status = useAlarmStatus();
  const { data: setting, refetch } = useAlarmSettingQuery();
  const [step, setStep] = useState<'welcome' | 'alarm'>('welcome');
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  // 결제는 끝났는데 서버 반영이 늦어 구독 캐시가 아직 무료일 수 있다 — 다시 받아야 알람 예약(AlarmSync)이 유료로 본다
  useEffect(() => {
    void queryClient.invalidateQueries({
      queryKey: subscriptionKeys.mine(userId),
    });
  }, [queryClient, userId]);

  const leave = () => router.replace(returnTo ?? homePath());

  // 셸이 알람을 못 쓴다고 답했으면(지원 안 하는 OS) 알람 단계를 건너뛴다. 아직 답이 없으면 쓸 수 있다고 본다
  const alarmCapable = isAlarmShell() && status?.supported !== false;

  // 알람 설정을 아직 모르면 받을 때까지 기다린다. 등록해 둔 재구독자나 끝내 못 읽은 경우는 등록 흐름을 보이지 않는다 — 다시 거치면 기존 시각을 덮어쓴다
  const next = async () => {
    if (!alarmCapable) return leave();
    const known = setting ?? (await refetch({ cancelRefetch: false })).data;
    if (known?.enabled === false) setStep('alarm');
    else leave();
  };

  // 셸의 답보다 먼저 알람 단계에 들어왔는데 뒤늦게 못 쓴다는 답이 오면 흐름을 접는다 — 걸 수 없는 알람을 등록시키지 않는다
  const unsupportedInAlarm = step === 'alarm' && status?.supported === false;
  useEffect(() => {
    if (unsupportedInAlarm) router.replace(returnTo ?? homePath());
  }, [unsupportedInAlarm, router, returnTo]);

  // 환영 연출이 도는 동안 알람 소개의 폰 그림을 받아 둔다 — 튀어 오르는 폰이 빈 자리로 오르지 않게
  const mayShowAlarmSetup = alarmCapable && setting?.enabled !== true;
  useEffect(() => {
    if (mayShowAlarmSetup) preloadIntroPreview();
  }, [mayShowAlarmSetup]);

  if (step === 'welcome') {
    return <PremiumWelcome onNext={() => void next()} />;
  }

  return (
    <AlarmSetupFlow
      status={status}
      initialTime={parseAlarmTime(setting?.time ?? null)}
      onSkip={leave}
      onDone={leave}
      source="premium_onboarding"
      // 환급 참여 여부는 아직 받지 않는다 — 결제한 상품(3·6개월)으로 정하게 되면 여기를 채운다
      refund={false}
    />
  );
};
