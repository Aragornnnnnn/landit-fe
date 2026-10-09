'use client';

// 알람 수정 — 알려주는 방식(잠금화면 알람 그림), 약속 시간(반복 매일·시각), 알람 삭제, 저장하기.
// 시각은 바텀시트 휠에서 고르고 「저장하기」를 눌러야 서버에 저장된다. 삭제는 켜짐을 끄는 저장이다
import { useEffect, useRef, useState } from 'react';
import type { AlarmTime } from '@landit/bridge';
import { useRouter } from 'next/navigation';

import {
  formatAlarmTime,
  parseAlarmTime,
  toServerTime,
} from '@/features/alarm/model/alarm-time';
import { isAlarmShell } from '@/features/alarm/model/shell-alarm';
import { useAlarmSettingQuery } from '@/features/alarm/model/useAlarmSettingQuery';
import { useSaveAlarmMutation } from '@/features/alarm/model/useSaveAlarmMutation';
import { LockScreenPreview } from '@/features/alarm/ui/LockScreenPreview';
import { TimeWheel, type TimeWheelHandle } from '@/features/alarm/ui/TimeWheel';
import {
  ALARM_SETTINGS_PATH,
  backOrReplace,
  MY_PAGE_PATH,
} from '@/shared/lib/routes';
import { useClientOnlyValue } from '@/shared/lib/useClientOnlyValue';
import { BackHeader } from '@/shared/ui/BackHeader';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { ChevronRightIcon } from '@/shared/ui/Icons';
import { RetryNotice } from '@/shared/ui/RetryNotice';

const SectionLabel = ({ children }: { children: string }) => (
  <h2 className="shrink-0 px-2 pt-2 text-[14px] font-medium text-muted-foreground">
    {children}
  </h2>
);

// 지우면 알람 화면도 등록 전으로 돌아가니 수정 → 알람 화면을 건너뛰어 내 정보까지 나간다.
// 직접 들어와 돌아갈 곳이 없으면 내 정보로 바꿔 넣는다
const leaveToMyPageAfterDelete = (router: {
  replace: (href: string) => void;
}) => {
  if (window.history.length > 2) window.history.go(-2);
  else router.replace(MY_PAGE_PATH);
};

const sameTime = (a: AlarmTime, b: AlarmTime) =>
  a.hour === b.hour && a.minute === b.minute;

const AlarmEditForm = ({
  saved,
  onDeleted,
}: {
  saved: AlarmTime;
  /** 삭제가 저장되면 — 바깥 화면이 "등록 전" 리다이렉트를 끄고 내 정보로 나가게 */
  onDeleted: () => void;
}) => {
  const router = useRouter();
  const { mutate: save, isPending } = useSaveAlarmMutation();
  const [time, setTime] = useState(saved);
  // 시트의 휠 — 관성으로 도는 중에 「확인」해도 보인 시각(휠이 마지막으로 지나간 칸)으로 정한다
  const wheelRef = useRef<TimeWheelHandle>(null);
  const [picking, setPicking] = useState(false);
  // 휠에 보여 줄 시각 — 시트가 닫히며 내려가는 동안에도 휠이 남아 있게 열 때의 값을 들고 있는다
  const [pickerTime, setPickerTime] = useState(saved);
  const openPicker = () => {
    setPickerTime(time);
    setPicking(true);
  };
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const back = () => backOrReplace(router, ALARM_SETTINGS_PATH);

  const submit = () => {
    if (sameTime(time, saved)) {
      back();
      return;
    }
    save(
      { time, enabled: true },
      // 실패 토스트는 저장 훅이 띄운다
      { onSuccess: back },
    );
  };

  // 지우면 알람 화면도 등록 전으로 돌아가니 내 정보까지 나간다
  const remove = () => {
    setConfirmingDelete(false);
    save(
      { time: saved, enabled: false },
      {
        onSuccess: () => {
          onDeleted();
          leaveToMyPageAfterDelete(router);
        },
      },
    );
  };

  return (
    <main className="flex h-dvh flex-col bg-background">
      <BackHeader onBack={back} title="알람 수정" />

      {/* 작은 폰에서도 약속 시간·알람 삭제·저장하기는 늘 보이게 — 폰 그림만 남는 높이에 맞춰 줄어든다 */}
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 bg-muted px-4 pt-2 pb-4">
        <SectionLabel>알려주는 방식</SectionLabel>
        <div className="flex min-h-0 flex-1 flex-col items-center gap-3 rounded-[20px] bg-card px-5 pt-5 pb-4">
          <div className="flex min-h-0 w-full flex-1 justify-center">
            <LockScreenPreview
              width={170}
              className="h-full w-auto max-w-[170px] object-contain"
            />
          </div>
          <p className="shrink-0 text-[14px] text-muted-foreground">
            소리가 울리고 잠금화면 위에 알람 화면이 떠요
          </p>
        </div>

        <SectionLabel>약속 시간</SectionLabel>
        <div className="shrink-0 rounded-[20px] bg-card pr-4 pl-5">
          <div className="flex items-center border-b border-border py-[18px]">
            <span className="flex-1 text-[16px] font-medium text-foreground">
              반복
            </span>
            <span className="text-[16px] font-medium text-muted-foreground">
              매일
            </span>
          </div>
          <button
            type="button"
            onClick={openPicker}
            className="flex w-full items-center gap-2 py-[18px] text-left"
          >
            <span className="flex-1 text-[16px] font-medium text-foreground">
              시각
            </span>
            <span className="text-[16px] font-medium text-foreground">
              {formatAlarmTime(time)}
            </span>
            <ChevronRightIcon size={16} className="text-[#C7C7CC]" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          // 저장이 진행 중이면 삭제를 막는다 — 둘 다 끝나면 저장의 뒤로 가기와 삭제의 두 칸 뒤로 가기가 겹친다
          disabled={isPending}
          className="shrink-0 rounded-[20px] bg-card py-4 text-[16px] font-medium text-destructive active:bg-muted disabled:opacity-40"
        >
          알람 삭제
        </button>
      </div>

      <div className="bg-muted px-6 pt-2 pb-[max(var(--safe-area-inset-bottom),24px)]">
        <Button onClick={submit} loading={isPending}>
          저장하기
        </Button>
      </div>

      <BottomSheet open={picking} onClose={() => setPicking(false)}>
        <h2 className="text-[20px] font-bold text-foreground">시각</h2>
        <div className="mt-2">
          {/* 열 때마다 그때 시각에서 시작한다 — 닫히는 중에 다시 열어도 새로 그린다 */}
          <TimeWheel
            key={toServerTime(pickerTime)}
            ref={wheelRef}
            initialValue={pickerTime}
            surface="card"
          />
        </div>
        <Button
          className="mt-4"
          onClick={() => {
            setTime(wheelRef.current?.read() ?? pickerTime);
            setPicking(false);
          }}
        >
          확인
        </Button>
      </BottomSheet>

      {/* 확인은 왼쪽 「취소」, 오른쪽 빨간 「삭제」 — 지우는 버튼이 무엇인지 그대로 보이게 */}
      <BottomSheet
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
      >
        <h2 className="text-[17px] font-bold text-foreground">
          알람을 삭제할까요?
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          다시 만들려면 약속을 새로 해야 해요
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button
            variant="ghost"
            size="md"
            onClick={() => setConfirmingDelete(false)}
          >
            취소
          </Button>
          <Button variant="danger" size="md" onClick={remove}>
            삭제
          </Button>
        </div>
      </BottomSheet>
    </main>
  );
};

export const AlarmEditScreen = () => {
  const router = useRouter();
  const { data: setting, isPending, isError, refetch } = useAlarmSettingQuery();
  const registered = setting?.enabled === true;

  // 알람을 모르는 환경(브라우저·구 셸)이면 설정을 못 읽어 빈 화면에 머문다 — 내 정보로 돌려보낸다
  const available = useClientOnlyValue(isAlarmShell, true);
  useEffect(() => {
    if (!available) router.replace(MY_PAGE_PATH);
  }, [available, router]);

  // 읽어 보니 등록 전이면 고칠 알람이 없다 — 알람 화면(등록 흐름)으로 보낸다. 못 읽었을 때는 넘겨짚지 않는다.
  // 방금 지운 경우는 내 정보로 나가는 중이라 끼어들지 않는다
  const deleted = useRef(false);
  useEffect(() => {
    if (deleted.current) return;
    if (!isPending && !isError && !registered)
      router.replace(ALARM_SETTINGS_PATH);
  }, [isPending, isError, registered, router]);

  if (isError) {
    return (
      <main className="flex h-dvh flex-col bg-background">
        <BackHeader
          onBack={() => backOrReplace(router, ALARM_SETTINGS_PATH)}
          title="알람 수정"
        />
        <RetryNotice
          screen="alarm"
          message="알람 설정을 불러오지 못했어요"
          onRetry={() => void refetch()}
        />
      </main>
    );
  }
  // 타입 좁히기를 겸한다 — 등록 전이면 위 effect가 알람 화면으로 보낸다
  if (setting?.enabled !== true)
    return <main className="h-dvh bg-background" />;
  return (
    <AlarmEditForm
      saved={parseAlarmTime(setting.time)}
      onDeleted={() => {
        deleted.current = true;
      }}
    />
  );
};
