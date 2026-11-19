// 무엇을 팔고 보여 줄지 정하는 규칙 — 언어·시각·스위치·앱 버전을 받아 기능별 켜짐을 한 곳에서 가른다.
// 화면은 언어나 환경변수를 직접 묻지 않고 이 답만 본다. 판매 정책이 바뀌면 이 파일만 고친다 (docs/subscription.md 「판매 스위치」)
import type { NativeContext } from '@landit/bridge';

import { isAppVersionAtLeast } from '@/shared/bridge/app-version';
import { sellsKoreaOnlyOffers, type Locale } from '@/shared/i18n/locale';

// 환급 이용권이 실린 앱 버전 — 스토어 심사가 플랫폼마다 따로라 따로 적는다 (LAN-665)
const REWARD_MIN_APP_VERSION: Record<NativeContext['platform'], string> = {
  ios: '1.4.0',
  android: '1.4.0',
};

/** 환급 이용권이 실린 앱인가 — 브라우저와 그 전 버전에는 상품이 없어 환급 화면도 열지 않는다 */
const carriesRewardPass = (context: NativeContext | null) =>
  context !== null &&
  isAppVersionAtLeast(
    context.appVersion,
    REWARD_MIN_APP_VERSION[context.platform],
  );

export interface OfferEnvironment {
  /** 화면 언어 — 환급·친구 초대·할인은 한국어 화면에서만 판다 */
  locale: Locale;
  /** 셸이 준 플랫폼·앱 버전. 브라우저면 null */
  context: NativeContext | null;
  /** 지금 시각(epoch ms) */
  now: number;
  /** NEXT_PUBLIC_REFUND_CHALLENGE — 환급 기능을 실은 배포인가 */
  rewardEnabled: boolean;
  /** 환급 판매를 끝내는 시각(epoch ms) — offer-schedule이 정한다. 없으면 팔지 않는다 */
  rewardSaleUntil: number | null;
  /** 친구 초대를 끝내는 시각(epoch ms). 없으면 열지 않는다 */
  referralUntil: number | null;
  /** NEXT_PUBLIC_PROMO_ENABLED — 이탈 할인 스위치 */
  promoEnabled: boolean;
}

export interface Offers {
  /** 환급 화면을 보여 주는가 — 이미 산 사람의 쌓인 금액·환급 화면·해지 안내. 판매가 끝나도 남는다 */
  rewardView: boolean;
  /** 환급을 파는가 — 페이월의 이용권, 환급 소개, 프리뷰의 환급 문장 */
  rewardSale: boolean;
  /** 프리미엄 프리뷰와 단계형 페이월을 여는가 — 환급을 팔든 구독만 팔든 같은 흐름이다 */
  previewFlow: boolean;
  /** 친구 초대를 여는가 — 온보딩 초대 코드, 내 정보·환급 화면의 초대 입구, 편지 버튼 */
  referral: boolean;
  /** 이탈 할인을 여는가 */
  exitPromo: boolean;
  /** 편지의 혜택가 버튼을 그리는가 */
  letterOffer: boolean;
  /** 홈의 이벤트 공지를 묻는가 */
  eventNotice: boolean;
}

/** 종료 시각 전인가 — 시각이 없으면 열리지 않은 것이다 */
const isBefore = (until: number | null, now: number) =>
  until !== null && now < until;

export const decideOffers = ({
  locale,
  context,
  now,
  rewardEnabled,
  rewardSaleUntil,
  referralUntil,
  promoEnabled,
}: OfferEnvironment): Offers => {
  const korean = sellsKoreaOnlyOffers(locale);
  const rewardView = korean && rewardEnabled && carriesRewardPass(context);
  // 환급을 파는 기간인가 — 앱 버전은 보지 않는다. 기간 안인데 상품이 없는 버전이면 팔 수도, 구독만 파는 흐름으로 돌릴 수도 없다
  const rewardSeason =
    korean && rewardEnabled && isBefore(rewardSaleUntil, now);
  const rewardSale = rewardView && rewardSeason;

  return {
    rewardView,
    rewardSale,
    previewFlow: rewardSale || !rewardSeason,
    referral: korean && isBefore(referralUntil, now),
    exitPromo: korean && promoEnabled,
    letterOffer: korean,
    eventNotice: korean,
  };
};
