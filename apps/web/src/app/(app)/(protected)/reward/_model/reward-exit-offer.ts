// 결제 전 환급 화면에서 나갈 때 띄우는 신규 회원 특가 시트 — 하루에 한 번만 띄운다. 띄운 날은 이 기기에 적어 둔다
const SHOWN_DATE_KEY = 'landit:reward-exit-offer-shown';

/** 오늘 띄울 차례인가 — 오늘 이미 띄웠으면 같은 날 다시 붙잡지 않는다 */
export const exitOfferDue = (lastShownDate: string | null, today: string) =>
  lastShownDate !== today;

// 저장소를 못 쓰면(비공개 모드 등) 안 띄운 것으로 본다 — 한 번 더 뜰 뿐 나가는 길은 막히지 않는다
export const readExitOfferShownDate = () => {
  try {
    return localStorage.getItem(SHOWN_DATE_KEY);
  } catch {
    return null;
  }
};

export const markExitOfferShown = (today: string) => {
  try {
    localStorage.setItem(SHOWN_DATE_KEY, today);
  } catch {
    // 저장 실패는 무시한다 — 다음에 한 번 더 뜰 뿐이다
  }
};
