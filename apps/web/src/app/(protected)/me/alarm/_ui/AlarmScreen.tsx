'use client';

// 알람 화면 — 등록 전이면 등록 흐름(결제 직후 온보딩과 같은 화면), 등록됐으면 시간 카드 하나. 카드를 누르면 알람 수정으로 간다.
// 권한이 꺼져 안 울리면 카드 위에 한 줄 배너를 띄운다
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ALARM_COPY } from '@/features/alarm/model/alarm-copy';
import {
  formatAlarmTime,
  parseAlarmTime,
} from '@/features/alarm/model/alarm-time';
import { isAlarmShell } from '@/features/alarm/model/shell-alarm';
import { useAlarmSettingQuery } from '@/features/alarm/model/useAlarmSettingQuery';
import { useAlarmStatus } from '@/features/alarm/model/useAlarmStatus';
import { AlarmPermissionBanner } from '@/features/alarm/ui/AlarmPermissionBanner';
import { AlarmSetupFlow } from '@/features/alarm/ui/AlarmSetupFlow';
import {
  ALARM_EDIT_PATH,
  backToMyPage,
  MY_PAGE_PATH,
} from '@/shared/lib/routes';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { BackHeader } from '@/shared/ui/BackHeader';
import { Emoji } from '@/shared/ui/emoji';
import { ChevronRightIcon } from '@/shared/ui/Icons';
import { RetryNotice } from '@/shared/ui/RetryNotice';

export const AlarmScreen = () => {
  const router = useRouter();
  const status = useAlarmStatus();
  const { data: setting, isPending, isError, refetch } = useAlarmSettingQuery();
  const registered = setting?.enabled === true;
  // 등록 흐름은 한 번 들어가면 끝까지 간다 — 다짐에서 저장되는 순간 registered가 되어도 권한·완료 화면을 마저 보여 준다
  const [inSetup, setInSetup] = useState(false);
  // 설정을 못 읽었을 때는 등록 전으로 넘겨짚지 않는다 — 등록한 사람에게 등록 흐름을 보여 덮어쓰게 된다
  if (!isPending && !isError && !registered && !inSetup) setInSetup(true);

  const leave = () => backToMyPage(router);

  // 알람을 모르는 환경(브라우저·구 셸)이면 설정을 못 읽어 화면이 비어 있게 된다 — 내 정보로 돌려보낸다
  const available = useClientOnlyValue(isAlarmShell, true);
  useEffect(() => {
    if (!available) router.replace(MY_PAGE_PATH);
  }, [available, router]);

  if (isPending) return <main className="h-dvh bg-background" />;

  if (isError && !inSetup) {
    return (
      <main className="flex h-dvh flex-col bg-background">
        <BackHeader onBack={leave} />
        <RetryNotice
          screen="alarm"
          message="알람 설정을 불러오지 못했어요"
          onRetry={() => void refetch()}
        />
      </main>
    );
  }

  if (inSetup) {
    return (
      <AlarmSetupFlow
        status={status}
        initialTime={parseAlarmTime(setting?.time ?? null)}
        onBack={leave}
        onDone={leave}
      />
    );
  }

  return (
    <main className="flex h-dvh flex-col bg-background">
      <BackHeader onBack={leave} />
      {/* 내 정보처럼 본문은 한 단계 진한 바탕에 흰 카드를 올려 카드가 또렷하게 보이게 한다 */}
      <div className="flex flex-1 flex-col gap-3 bg-muted px-4 pt-2">
        <div className="px-2 pb-3">
          <h1 className="text-[28px] font-black text-foreground">알람</h1>
          <p className="mt-1.5 text-[15px] font-medium text-muted-foreground">
            {ALARM_COPY.settingsDescription}
          </p>
        </div>

        <AlarmPermissionBanner status={status} />

        <button
          type="button"
          onClick={() => router.push(ALARM_EDIT_PATH)}
          className="flex items-center gap-3.5 rounded-2xl bg-card px-5 py-5 text-left active:scale-[0.99] active:bg-muted"
        >
          <Emoji className="shrink-0 text-[30px]">🤝</Emoji>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[15px] font-bold text-foreground">
              시나리오 알람
            </span>
            <span className="mt-0.5 text-[14px] text-muted-foreground">
              매일
            </span>
          </span>
          <span className="shrink-0 text-[17px] font-bold text-foreground">
            {formatAlarmTime(parseAlarmTime(setting?.time ?? null))}
          </span>
          <ChevronRightIcon
            size={18}
            className="-mr-1 shrink-0 text-[#C7C7CC]"
          />
        </button>
      </div>
    </main>
  );
};
