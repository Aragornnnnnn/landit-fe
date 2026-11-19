// 친구 초대를 누구에게 보여 줄지 정하는 규칙 — 초대가 열려 있을 때, 초대 적립금이 환급에 더해지므로 환급을 권할 무료 유저와 참여자에게만 보인다
export const referralAudienceOf = ({
  live,
  invited,
  participant,
  settled,
  fetching,
}: {
  // 친구 초대가 열려 있는가 — 닫혔으면 아무에게도 보이지 않는다
  live: boolean;
  // 환급을 권할 무료 유저인가
  invited: boolean;
  // 환급에 참여한 사람인가
  participant: boolean;
  // 누구인지 다 알게 됐는가
  settled: boolean;
  // 환급을 다시 받는 중인가 — 결제 직후처럼 받아 둔 답이 곧 바뀔 수 있다(환급 화면과 같은 가드)
  fetching: boolean;
}) => ({
  shown: live && (invited || participant),
  // 닫혔으면 더 기다릴 것이 없다
  settled: !live || participant || (settled && !fetching),
});
