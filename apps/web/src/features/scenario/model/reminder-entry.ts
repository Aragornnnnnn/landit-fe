// 알림 진입 판정 — 주소의 UTM을 읽어 리마인드 알림으로 왔는지 정하고, 읽은 UTM은 주소에서 지운다.
// 남겨두면 하드웨어 뒤로가기로 이 주소에 돌아올 때마다 알림 진입으로 오인해 다시 소환하고 페이지뷰 유입도 중복된다
import {
  isDailyReminderEntry,
  stripEntryFromAddress,
} from '@/shared/analytics/utm';

export const consumeReminderEntry = () => {
  const fromReminder = isDailyReminderEntry(
    new URLSearchParams(window.location.search),
  );
  // 리마인드가 아닌 유입(다른 캠페인·위젯·알람)도 딱지는 뗀다 — 판정만 다르다
  stripEntryFromAddress();
  return fromReminder;
};
