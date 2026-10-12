// 환급 챌린지가 내거는 값 — 기간과, 결제 금액에서 나오는 하루 몫·최대 환급액. 페이월·환급 소개·결제 직후 안내가 같은 산식을 쓴다

/** 챌린지 기간(일). 스토어 상품에는 기간 정보가 없어, 권한을 주는 서버와 같은 값을 여기 적는다 */
export const CHALLENGE_DAYS = 100;

export interface RewardOffer {
  days: number;
  /** 오늘의 시나리오를 끝낸 날 쌓이는 금액 */
  dailyWon: number;
  /** 하루도 빠짐없이 채웠을 때 돌려받는 금액 */
  maximumWon: number;
}

/**
 * 결제 금액으로 챌린지 값을 만든다 — 하루 몫은 결제 금액을 일수로 나눈 값(원 단위 내림)이고, 다 채우면 그 합을 돌려받는다.
 *
 * @param priceWon 결제 금액(원)
 */
export const rewardOfferOf = (priceWon: number): RewardOffer => {
  const dailyWon = Math.floor(priceWon / CHALLENGE_DAYS);
  return {
    days: CHALLENGE_DAYS,
    dailyWon,
    // 하루 몫을 날마다 다 받은 합 — 일수로 나눠떨어지지 않는 가격에서도 화면의 숫자끼리 어긋나지 않는다
    maximumWon: dailyWon * CHALLENGE_DAYS,
  };
};
