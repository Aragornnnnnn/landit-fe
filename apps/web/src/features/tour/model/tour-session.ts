// 이 앱 실행에서 투어를 진행 중인가 — 아니면 홈에서 "아까 하다 나갔죠?" 안내부터 띄운다.
// 앱을 새로 열면 잊는다
let live = false;

export const markTourLive = () => {
  live = true;
};

export const isTourLive = () => live;
