// 알람 "대화하러 가기" 링크 — Android 알람 버튼은 이 링크로 앱을 열고, 셸은 링크로 어느 알람에서 왔는지 안다
export const ALARM_LINK = 'landit://alarm';

// 라이브러리가 {alarmId}를 울린 알람 id로 바꿔 끼운다
export const ALARM_LAUNCH_URI = `${ALARM_LINK}?alarmId={alarmId}`;

export const isAlarmLink = (url: string) =>
  url
    .replace(/^[^:]+:\/*/, '') // 스킴 제거 (슬래시 1개·2개 모두 허용)
    .split(/[?#]/)[0] === 'alarm';

// 알람 링크면 알람 id를, 아니면(위젯·알림·OAuth·없음) null을 돌려준다
export const alarmIdFromLink = (url: string | null | undefined) => {
  if (!url || !isAlarmLink(url)) return null;
  const match = /[?&]alarmId=([^&#]+)/.exec(url);
  return match ? decodeURIComponent(match[1]) : null;
};
