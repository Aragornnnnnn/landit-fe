// 소환 게이트 — 램프 등장 애니메이션은 그날 처음이거나 알림으로 들어왔을 때만. 그 외엔 카드에 담겨 있다
const SEEN_KEY = 'landit:lamp-summoned';

interface SummonSignals {
  // 마지막으로 등장 애니메이션을 본 날 (서버가 준 yyyy-MM-dd). 기록이 없으면 null
  lastSeen: string | null;
  // 서버가 준 오늘 — 기기 시간으로 계산하면 자정 경계가 서버와 어긋난다
  today: string;
  // 시나리오 리마인더 알림으로 들어왔는가
  fromReminder: boolean;
}

export const decideSummon = ({
  lastSeen,
  today,
  fromReminder,
}: SummonSignals) => fromReminder || lastSeen !== today;

// 연출이 시작된 순간 기록한다 — 수락까지 기다리면 X 뒤 재진입마다 다시 나와 성가시다.
// 저장이 막힌 환경(사파리 프라이빗 등)에선 조용히 넘어간다 — 소환이 한 번 더 나올 뿐이다
export const markSummoned = (today: string) => {
  try {
    localStorage.setItem(SEEN_KEY, today);
  } catch {
    // 무시
  }
};

export const readLastSummoned = () => {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
};
