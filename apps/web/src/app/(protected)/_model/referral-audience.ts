// 친구 초대를 누구에게 보여 줄지 정하는 규칙 — 초대 적립금은 환급에 더해지므로 환급을 권할 무료 유저와 참여자에게만 보인다
export const referralAudienceOf = ({
  invited,
  participant,
  settled,
}: {
  // 환급을 권할 무료 유저인가
  invited: boolean;
  // 환급에 참여한 사람인가
  participant: boolean;
  // 누구인지 다 알게 됐는가
  settled: boolean;
}) => ({
  shown: invited || participant,
  settled: settled || participant,
});
