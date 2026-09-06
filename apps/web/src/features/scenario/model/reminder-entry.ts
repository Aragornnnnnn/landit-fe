// 알림 진입 판정 — 주소의 UTM을 읽어 리마인드 알림으로 왔는지 정하고, 읽은 UTM은 주소에서 지운다.
// 남겨두면 하드웨어 뒤로가기로 이 주소에 돌아올 때마다 알림 진입으로 오인해 다시 소환하고 페이지뷰 유입도 중복된다.
// replaceState여도 라우터가 주소 변화를 알아채 같은 화면을 다시 그린다 — 그 재렌더는 PageViewTracker가 걸러 페이지뷰를 안 쏜다
import { isDailyReminderEntry } from '@/shared/analytics/utm';

export const consumeReminderEntry = () => {
  const params = new URLSearchParams(window.location.search);
  const fromReminder = isDailyReminderEntry(params);

  // 리마인드가 아닌 유입(다른 캠페인·위젯)도 딱지는 뗀다 — 판정만 다르다
  const utmKeys = [...params.keys()].filter((key) => key.startsWith('utm_'));
  if (utmKeys.length > 0) {
    utmKeys.forEach((key) => params.delete(key));
    const search = params.toString();
    window.history.replaceState(
      null,
      '',
      window.location.pathname + (search ? `?${search}` : ''),
    );
  }
  return fromReminder;
};
