// 스몰톡을 더 시작할 수 없는가 — 서버 canStart를 따르되, 정책이 켜진 뒤 학습 문이 열린 사람은 소진으로 보지 않는다

/**
 * @param canStart 서버가 시작할 수 있다고 했는가 (받아 둔 응답이라 결제 직후엔 결제 전 값일 수 있다)
 * @param trialOn 서버가 무료 5분 정책을 켰는가 — 켜지기 전엔 예전 하루 한도라 서버 판정을 그대로 따른다
 * @param open 학습 문이 열렸는가(구독 중). 판정 중이면 false
 */
export const isTalkExhausted = ({
  canStart,
  trialOn,
  open,
}: {
  canStart: boolean;
  trialOn: boolean;
  open: boolean;
}) => !canStart && !(trialOn && open);
