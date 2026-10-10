'use client';

// 알람 점검 화면(ADMIN) — 서버 설정과 이 폰에 걸린 알람을 나란히 보고, 실제로 울릴 시각을 고른 테스트 알람으로 울림을 확인한다
import { useEffect, useState } from 'react';
import type { ScheduledAlarm } from '@landit/bridge';
import { useRouter } from 'next/navigation';

import {
  DEFAULT_ALARM_TIME,
  formatClock,
  parseAlarmTime,
  toServerTime,
} from '@/features/alarm/model/alarm-time';
import {
  ALARM_TITLE,
  ALARM_TYPE,
  alarmPlatform,
} from '@/features/alarm/model/shell-alarm';
import { useAlarmSettingQuery } from '@/features/alarm/model/useAlarmSettingQuery';
import { useAlarmStatus } from '@/features/alarm/model/useAlarmStatus';
import { useSaveAlarmMutation } from '@/features/alarm/model/useSaveAlarmMutation';
import { useSubscriptionQuery } from '@/features/subscription/model/my-subscription/useSubscriptionQuery';
import { useAuthStore } from '@/shared/auth/auth-store';
import { getNativeContext } from '@/shared/bridge/native-context';
import { postToNative } from '@/shared/bridge/web-bridge';
import { backToMyPage } from '@/shared/lib/routes';
import { BackHeader } from '@/shared/ui/BackHeader';
import { Emoji } from '@/shared/ui/emoji';
import { showToast } from '@/shared/ui/toast';

import { describeNextRing, testAlarmChoices } from '../_model/alarm-check';
import { useAlarmList } from '../_model/useAlarmList';
import { compareWithServer } from '../../_model/alarm-comparison';
import { MenuButton, MenuSection, ROW_CLASS, ROW_STYLE } from '../../_ui/Menu';

const PERMISSION_LABEL = {
  granted: '허용됨',
  denied: '거부됨',
  undetermined: '아직 안 물음',
} as const;

const clock = (date: Date) =>
  formatClock({ hour: date.getHours(), minute: date.getMinutes() });

// 1초마다 지금 시각 — 테스트 알람 선택지와 남은 시간이 늘 "지금 누르면"을 보여 주게
const useNow = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
};

const TONE_CLASS = {
  default: 'text-foreground',
  danger: 'font-bold text-destructive',
  good: 'font-bold text-primary',
} as const;

// 상태 목록 — 눌리지 않는 "라벨: 값" 글자다. 메뉴 줄과 섞이지 않게 카드 안 옅은 상자에 구분선 없이 촘촘히 적는다
const StatusList = ({
  note,
  children,
}: {
  /** 값이 아니라 설명인 한마디 — 목록 아래에 작게 적는다 */
  note?: string;
  children: React.ReactNode;
}) => (
  <div className="m-3 rounded-lg bg-muted/70 px-3.5 py-3">
    <dl className="space-y-1.5 text-[13px] leading-snug">{children}</dl>
    {note && (
      <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
        {note}
      </p>
    )}
  </div>
);

const StatusItem = ({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  tone?: keyof typeof TONE_CLASS;
}) => (
  <div className="flex items-center justify-between gap-4">
    <dt className="shrink-0 text-muted-foreground">{label}</dt>
    <dd className={`text-right ${TONE_CLASS[tone]}`}>{value}</dd>
  </div>
);

const Notice = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-xl bg-card px-4 py-4 text-sm text-muted-foreground">
    {children}
  </p>
);

const remaining = (at: number, now: Date) => {
  const seconds = Math.max(0, Math.ceil((at - now.getTime()) / 1000));
  return seconds >= 60
    ? `${Math.floor(seconds / 60)}분 ${seconds % 60}초`
    : `${seconds}초`;
};

// 예약한 테스트 알람의 취소 — 테스트 알람은 폰에만 있어 지우면 그대로 사라진다
const CancelTestButton = ({ alarm }: { alarm: ScheduledAlarm }) => (
  <button
    type="button"
    onClick={() => postToNative({ type: 'CANCEL_ALARM', id: alarm.id })}
    className="ml-2 rounded-full bg-card px-2.5 py-1 text-[12px] font-bold text-foreground ring-1 ring-border active:scale-95"
  >
    취소
  </button>
);

// 매일 알람 시각을 바로 정해 저장한다 — 다짐(지문 3초) 없이 폰 기본 시각 선택기로 고른다
const DailyTimeRow = ({
  serverTime,
  enabled,
  disabled,
  onSave,
}: {
  /** 서버에 저장된 시각 "HH:mm". 없으면 기본 시각에서 시작한다 */
  serverTime: string | null;
  /** 서버 알람이 켜져 있는가 — 꺼져 있으면 같은 시각이어도 저장하면 켜진다 */
  enabled: boolean;
  disabled: boolean;
  onSave: (time: string) => void;
}) => {
  const [draft, setDraft] = useState<string | null>(null);
  const time = draft ?? serverTime ?? toServerTime(DEFAULT_ALARM_TIME);
  // 이미 켜져 있고 시각도 그대로면 저장할 것이 없다
  const unchanged = enabled && time === serverTime;
  return (
    <div className={`${ROW_CLASS} active:bg-transparent`} style={ROW_STYLE}>
      <Emoji>⏰</Emoji>
      <label
        htmlFor="daily-alarm-time"
        className="flex-1 text-[15px] whitespace-nowrap text-foreground"
      >
        시각 정하기
      </label>
      <input
        id="daily-alarm-time"
        type="time"
        value={time}
        onChange={(event) => setDraft(event.target.value)}
        className="rounded-lg bg-muted px-2.5 py-1.5 text-[15px] font-bold text-foreground tabular-nums"
      />
      <button
        type="button"
        disabled={disabled || time === '' || unchanged}
        onClick={() => onSave(time)}
        className="shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-bold text-primary-foreground active:scale-95 disabled:bg-muted disabled:text-muted-foreground disabled:active:scale-100"
      >
        저장
      </button>
    </div>
  );
};

// 점검 본문 — 셸에 묻고 1초마다 다시 그리므로 ADMIN일 때만 올린다
const AlarmCheck = () => {
  const member = useAuthStore((state) => state.member);
  const status = useAlarmStatus();
  const alarms = useAlarmList();
  const now = useNow();
  const { data: setting } = useAlarmSettingQuery();
  const { subscription } = useSubscriptionQuery();
  const { mutate: saveAlarm, isPending: saving } = useSaveAlarmMutation();

  const isAndroid = alarmPlatform() === 'android';
  // 아직 안 울린 테스트 알람 — 먼저 울릴 것부터
  const pendingTests = (alarms ?? [])
    .filter((alarm) => alarm.alarmType === null && alarm.nextAt !== null)
    .toSorted((a, b) => (a.nextAt ?? 0) - (b.nextAt ?? 0));
  // 이 폰에 걸린 매일 알람의 다음 울림
  const daily = alarms?.find((alarm) => alarm.alarmType === ALARM_TYPE);

  const sync = compareWithServer(setting, status);

  // 실제 알람과 같은 문구로 울린다 — 사용자가 보게 될 화면 그대로 확인하려고
  const scheduleTest = (delaySeconds: number) =>
    postToNative({ type: 'TEST_ALARM', delaySeconds, title: ALARM_TITLE });

  // 매일 알람을 곧 울릴 시각으로 저장한다 — 실제 사용자 흐름(서버 저장 → 동기화 → 셸 예약) 그대로 걸린다
  const dailySoon = new Date(now.getTime() + 60_000);
  dailySoon.setSeconds(60, 0);
  const scheduleDailySoon = () =>
    saveAlarm({
      time: { hour: dailySoon.getHours(), minute: dailySoon.getMinutes() },
      enabled: true,
    });
  const saveDailyAt = (time: string) =>
    saveAlarm(
      { time: parseAlarmTime(time), enabled: true },
      { onSuccess: () => showToast(`매일 ${time}로 저장했어요`) },
    );
  const turnOffDaily = () => {
    if (setting) {
      saveAlarm({ time: parseAlarmTime(setting.time), enabled: false });
    }
  };

  const native = getNativeContext();
  const environment = [
    native
      ? `${native.platform} ${native.appVersion} (${native.buildNumber})`
      : '브라우저',
    native && `브릿지 ${native.bridgeVersion}`,
    `계정 ${member?.userId ?? '-'}`,
    'ADMIN',
    subscription?.premium ? '유료' : '무료',
  ]
    .filter(Boolean)
    .join(' · ');
  // 보안 컨텍스트가 아니면(LAN 주소로 붙은 셸) 클립보드가 없다 — 실패하면 실패했다고 알린다
  const copyEnvironment = async () => {
    try {
      await navigator.clipboard.writeText(environment);
      showToast('환경 정보를 복사했어요');
    } catch {
      showToast('복사하지 못했어요');
    }
  };

  if (!status) {
    return <Notice>알람을 모르는 환경이에요 (브라우저·구버전 앱)</Notice>;
  }

  return (
    <>
      <MenuSection title="테스트 알람 — 누르면 아래 시각에 한 번 울려요">
        <StatusList>
          {pendingTests.length === 0 ? (
            <StatusItem label="예약한 테스트 알람" value="없음" />
          ) : (
            pendingTests.map((alarm) => (
              <StatusItem
                key={alarm.id}
                label={`${formatClock(alarm)}에 울려요`}
                tone="good"
                value={
                  <>
                    {alarm.nextAt !== null &&
                      `${remaining(alarm.nextAt, now)} 남음`}
                    <CancelTestButton alarm={alarm} />
                  </>
                }
              />
            ))
          )}
        </StatusList>
        {testAlarmChoices(now).map(({ at, delaySeconds }, index) => (
          <MenuButton
            key={at.getTime()}
            title={`${index + 1}분 뒤 · ${clock(at)}에 울리기`}
            icon={<Emoji>⏰</Emoji>}
            chevron={false}
            onClick={() => scheduleTest(delaySeconds)}
          />
        ))}
      </MenuSection>

      {/* 매일 알람은 서버가 정한다 — 폰에서 지워도 앱이 서버에 맞춰 다시 걸므로, 끄는 길은 서버 설정을 끄는 것 하나다 */}
      <MenuSection title="매일 알람 — 서버 설정대로 걸려요. 아래 버튼은 실제 알람을 바꿔요">
        <StatusList
          note={
            subscription?.premium === false
              ? '결제 유저가 아니지만 ADMIN이라 매일 알람이 걸려요'
              : undefined
          }
        >
          <StatusItem label="서버에 저장된 알람" value={sync.server} />
          <StatusItem
            label="이 폰에 걸린 알람"
            value={sync.phone}
            tone={sync.differs ? 'danger' : 'default'}
          />
          {/* 서버 설정을 받기 전에는 맞다고도 다르다고도 하지 않는다 */}
          {setting && (
            <StatusItem
              label="서버와 폰"
              value={sync.differs ? '달라요 — 곧 다시 걸려요' : '서로 맞아요 ✓'}
              tone={sync.differs ? 'danger' : 'good'}
            />
          )}
          {daily && (
            <StatusItem
              label="다음 울림"
              value={describeNextRing(daily.nextAt, now)}
            />
          )}
          {daily?.skipDate && (
            <StatusItem label="건너뛴 회차" value={daily.skipDate} />
          )}
        </StatusList>
        <DailyTimeRow
          key={setting?.time ?? 'unset'}
          serverTime={setting?.time ?? null}
          enabled={setting?.enabled === true}
          disabled={saving}
          onSave={saveDailyAt}
        />
        <MenuButton
          title={`1분 뒤로 바꾸기 (${clock(dailySoon)})`}
          icon={<Emoji>🗓️</Emoji>}
          chevron={false}
          disabled={saving}
          onClick={scheduleDailySoon}
        />
        <MenuButton
          title="오늘 회차 건너뛰기"
          icon={<Emoji>✅</Emoji>}
          chevron={false}
          onClick={() =>
            postToNative({ type: 'SKIP_ALARM_TODAY', alarmType: ALARM_TYPE })
          }
        />
        <MenuButton
          title="매일 알람 끄기 (등록 전으로)"
          icon={<Emoji>🗑️</Emoji>}
          chevron={false}
          disabled={saving || !setting?.enabled}
          onClick={turnOffDaily}
        />
      </MenuSection>

      <MenuSection title="권한">
        <StatusList>
          {/* Android의 권한 값은 정확한 시각과 같은 값이라 아래 줄로 대신한다 */}
          {isAndroid ? (
            <>
              <StatusItem
                label="알림"
                value={
                  status.notifications ? '허용됨' : '꺼짐 — 알람이 안 걸려요'
                }
                tone={status.notifications ? 'default' : 'danger'}
              />
              <StatusItem
                label="정확한 시각"
                value={status.exactAlarm ? '켜짐' : '꺼짐'}
                tone={status.exactAlarm ? 'default' : 'danger'}
              />
              <StatusItem
                label="잠금화면 전체 화면"
                value={status.fullScreen ? '켜짐' : '꺼짐'}
                tone={status.fullScreen ? 'default' : 'danger'}
              />
            </>
          ) : (
            <StatusItem
              label="알람 권한"
              value={
                status.supported
                  ? PERMISSION_LABEL[status.permission]
                  : '이 기기는 못 써요'
              }
              tone={status.permission === 'granted' ? 'default' : 'danger'}
            />
          )}
        </StatusList>
        {/* iOS는 한 번 거부하면 앱이 다시 물을 수 없다 — 그때는 설정 앱으로 보낸다 */}
        <MenuButton
          title={
            !isAndroid && status.permission === 'denied'
              ? '알람 권한 켜러 가기 (설정 앱)'
              : '알람 권한 요청'
          }
          icon={<Emoji>🔔</Emoji>}
          chevron={false}
          onClick={() =>
            postToNative(
              !isAndroid && status.permission === 'denied'
                ? { type: 'OPEN_SETTINGS' }
                : { type: 'REQUEST_ALARM_PERMISSION' },
            )
          }
        />
        {isAndroid && (
          <>
            <MenuButton
              title="정확한 알람 설정 열기"
              icon={<Emoji>📱</Emoji>}
              onClick={() =>
                postToNative({
                  type: 'OPEN_ALARM_SETTINGS',
                  target: 'exactAlarm',
                })
              }
            />
            <MenuButton
              title="전체 화면 알림 설정 열기"
              icon={<Emoji>📱</Emoji>}
              onClick={() =>
                postToNative({
                  type: 'OPEN_ALARM_SETTINGS',
                  target: 'fullScreen',
                })
              }
            />
          </>
        )}
      </MenuSection>

      <MenuSection title="환경">
        <StatusList>
          <StatusItem label="환경" value={environment} />
        </StatusList>
        <MenuButton
          title="환경 정보 복사"
          icon={<Emoji>📄</Emoji>}
          chevron={false}
          onClick={() => void copyEnvironment()}
        />
      </MenuSection>
    </>
  );
};

export const AlarmCheckScreen = () => {
  const router = useRouter();
  const isAdmin = useAuthStore((state) => state.member?.role === 'ADMIN');

  return (
    <main className="flex h-dvh flex-col bg-muted">
      <BackHeader title="알람 점검" onBack={() => backToMyPage(router)} />

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 px-4 pt-3 pb-10">
          {isAdmin ? (
            <AlarmCheck />
          ) : (
            <Notice>ADMIN 계정에서만 볼 수 있어요</Notice>
          )}
        </div>
      </div>
    </main>
  );
};
