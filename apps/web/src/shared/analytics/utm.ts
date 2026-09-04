// 유입 딱지 어휘 — 붙이는 곳(BE 푸시 페이로드·셸 위젯 진입)과 읽는 곳(페이지뷰 계측, 램프 등장 게이트)이 같은 값을 봐야 한다.
// 자리 규칙과 전체 어휘는 docs/analytics-utm.md가 정본이다

// BE 서버 푸시가 딥링크에 다는 값 — ScheduledNotificationContent.campaign()·PushQueueMessageHandler와 같다
export const PUSH_UTM_SOURCE = 'push';
export const PUSH_UTM_MEDIUM = 'notification';
// 구 로컬 알림(1.1.0 셸이 예약해 둔 것)이 달던 medium — 아직 안 지워진 예약을 탭해도 알림 유입으로 읽는다
const LEGACY_PUSH_UTM_MEDIUM = 'push';

// 오늘의 시나리오 리마인드 — 램프가 알림 진입을 알아보고 스스로 소환되는 캠페인
export const DAILY_REMINDER_CAMPAIGN = 'daily_scenario_reminder';
const LEGACY_DAILY_REMINDER_CAMPAIGN = 'daily_reminder';

// 알림을 탭해 들어온 주소인가 — 어느 캠페인·경로든 medium 하나로 판별한다
export const isNotificationEntry = (params: URLSearchParams) => {
  const medium = params.get('utm_medium');
  return medium === PUSH_UTM_MEDIUM || medium === LEGACY_PUSH_UTM_MEDIUM;
};

// 오늘의 시나리오 리마인드 알림으로 들어왔는가 — 램프 자동 소환의 열쇠
export const isDailyReminderEntry = (params: URLSearchParams) => {
  const campaign = params.get('utm_campaign');
  return (
    isNotificationEntry(params) &&
    (campaign === DAILY_REMINDER_CAMPAIGN ||
      campaign === LEGACY_DAILY_REMINDER_CAMPAIGN)
  );
};

// 홈 화면 위젯 탭 — 셸이 WIDGET_ENTRY_PATH(apps/mobile/src/widgets/widget-link.ts)에 다는 값
export const WIDGET_UTM_MEDIUM = 'widget';

export const isWidgetEntry = (params: URLSearchParams) =>
  params.get('utm_medium') === WIDGET_UTM_MEDIUM;

// 밖에서 들어온 유입인가 — 알림·위젯 어느 쪽이든. 어느 채널인지는 캠페인 이름이 가른다
export const isExternalEntry = (params: URLSearchParams) =>
  isNotificationEntry(params) || isWidgetEntry(params);
