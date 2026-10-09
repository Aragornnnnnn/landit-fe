'use client';

// 알람 등록 흐름 — 알람 소개 → 시간 정하고 3초 다짐(여기서 저장) → 권한 → 등록 완료.
// 마이페이지(뒤로 가기)와 프리미엄 온보딩(「다음에 할게요」)이 같이 쓴다. 권한을 거절해도 다짐은 저장돼 있고, 완료 화면이 한 번 더 켜게 권한다
import { useEffect, useRef, useState } from 'react';
import type { AlarmStatus, AlarmTime } from '@landit/bridge';

import { alarmCopy, AlarmCopyContext } from '../model/alarm-copy';
import { useAlarmUnblock } from '../model/useAlarmUnblock';
import { useSaveAlarmMutation } from '../model/useSaveAlarmMutation';
import { AlarmIntro } from './AlarmIntro';
import { AlarmPledge } from './AlarmPledge';
import { AlarmRegistered } from './AlarmRegistered';
import { AlarmUnblockSheets } from './AlarmUnblockSheets';

type Step = 'intro' | 'pledge' | 'registered';

// "다짐했어요!"가 최소한 보이는 시간
const PLEDGED_MIN_MS = 600;

export const AlarmSetupFlow = ({
  status,
  initialTime,
  onBack,
  onSkip,
  onDone,
  refund,
}: {
  /** 셸 알람 상태 — 화면이 이미 묻고 있는 것을 받아 같은 조회를 두 번 하지 않는다 */
  status: AlarmStatus | null;
  initialTime: AlarmTime;
  /** 소개 화면에서 뒤로 — 마이페이지 */
  onBack?: () => void;
  /** 소개 화면에서 「다음에 할게요」 — 프리미엄 온보딩 */
  onSkip?: () => void;
  onDone: () => void;
  /** 환급 참여자인가 — 소개 제목과 다짐 문장이 환급 톤이 된다 */
  refund: boolean;
}) => {
  const { blocker, setupStep, unblock, sheet, closeSheet } =
    useAlarmUnblock(status);
  const { mutate: save } = useSaveAlarmMutation();
  const [step, setStep] = useState<Step>('intro');
  const [time, setTime] = useState(initialTime);
  // 저장이 실패하면 다짐 화면을 새로 그려 지문을 비운다
  const [attempt, setAttempt] = useState(0);

  const askPermission = async () => {
    switch (setupStep()) {
      case 'ask':
        await unblock();
        setStep('registered');
        return;
      case 'android-sheet':
        // 시트를 닫으면 등록 완료로 넘어간다
        await unblock();
        return;
      case 'finish':
        setStep('registered');
        return;
    }
  };

  // 지문이 다 차는 순간 저장을 시작한다. "다짐했어요!"는 저장하는 동안 보이고,
  // 저장이 아주 빨라도 그 글자가 읽힐 만큼은 머문 뒤 넘어간다
  // 화면을 떠났으면(Android 하드웨어 뒤로가기 등) 권한을 묻지 않는다 — 내 정보 위에 팝업이 뜨지 않게
  const permissionTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(permissionTimer.current), []);

  const pledge = (next: AlarmTime) => {
    setTime(next);
    const startedAt = Date.now();
    save(
      { time: next, enabled: true },
      {
        onSuccess: () => {
          const wait = Math.max(0, PLEDGED_MIN_MS - (Date.now() - startedAt));
          permissionTimer.current = setTimeout(
            () => void askPermission(),
            wait,
          );
        },
        // 실패 토스트는 저장 훅이 띄운다 — 여기선 지문을 비워 다시 누르게만 한다
        onError: () => setAttempt((count) => count + 1),
      },
    );
  };

  const copy = alarmCopy(refund);

  if (step === 'intro') {
    return (
      <AlarmCopyContext value={copy}>
        <AlarmIntro
          onNext={() => setStep('pledge')}
          onBack={onBack}
          onSkip={onSkip}
        />
      </AlarmCopyContext>
    );
  }

  return (
    <AlarmCopyContext value={copy}>
      {step === 'registered' ? (
        <AlarmRegistered
          time={time}
          blocked={blocker !== null}
          onUnblock={() => void unblock()}
          onDone={onDone}
        />
      ) : (
        <AlarmPledge
          key={attempt}
          initialTime={time}
          onBack={() => setStep('intro')}
          onPledge={pledge}
        />
      )}
      <AlarmUnblockSheets
        sheet={sheet}
        status={status}
        onClose={(closed) => {
          closeSheet();
          // 다짐 직후 연 Android 시트면 닫는 대로 등록 완료로 넘어간다
          if (closed === 'android-settings') setStep('registered');
        }}
      />
    </AlarmCopyContext>
  );
};
