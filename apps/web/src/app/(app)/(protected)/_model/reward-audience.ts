// 환급을 누구에게 권할지 정하는 규칙 — 출시 스위치, 결제 환경, 구독 여부, 환급 참여 여부를 한 곳에서 본다
export interface RewardAudience {
  // 환급을 권할 사람 — 결제가 열린 환경에서, 환급에 참여한 적 없는 무료 유저
  invited: boolean;
  // 누구인지 다 알게 됐는가. 그 전에는 화면이 단정하지 않는다
  settled: boolean;
}

export const rewardAudienceOf = ({
  launched,
  paymentLive,
  premium,
  subscriptionFailed,
  rewardLoaded,
  rewardFailed,
  participant,
}: {
  // 환급 챌린지 출시 스위치
  launched: boolean;
  paymentLive: boolean;
  // 구독 여부. 아직 모르면 undefined
  premium: boolean | undefined;
  subscriptionFailed: boolean;
  rewardLoaded: boolean;
  // 한 번도 받지 못한 채 실패했다 — 기다려도 오지 않는다
  rewardFailed: boolean;
  // 환급 응답이 참여자라고 말했는가 — 구독이 끝난 뒤에도 돌려받을 금액이 남을 수 있다
  participant: boolean;
}): RewardAudience => {
  // 스위치가 꺼져 있으면 환급은 없는 기능이다
  if (!launched) return { invited: false, settled: true };

  // 결제가 닫힌 환경에서는 구독을 묻지 않고, 조회가 실패하면 기다려도 오지 않는다
  const subscriptionSettled =
    !paymentLive || premium !== undefined || subscriptionFailed;
  return {
    invited: rewardLoaded && !participant && paymentLive && premium === false,
    settled: (rewardLoaded || rewardFailed) && subscriptionSettled,
  };
};

/**
 * 프리뷰 다시 보기(개발자 묶음)에서는 환급을 권할 무료 유저로 친다 — 유료·참여자 계정도 홈에 돌아온 순간의 동전 연출과
 * 「0원 프리미엄 시작하기」 알약을 실제 첫 대화 뒤처럼 본다. 참여 기록과 놓친 금액은 지워 평소 진입 글자가 보이게 한다
 */
export const asPreviewReplay = <Query extends object>(query: Query) => ({
  ...query,
  reward: null,
  preview: null,
  // 다시 보기는 처음 보는 무료 유저로 친다 — 보관 중인 돈도 없는 것으로
  storedWon: 0,
  loaded: true,
  invited: true,
  settled: true,
});
