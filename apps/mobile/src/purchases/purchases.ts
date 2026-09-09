// RevenueCat SDK 래퍼 — 브릿지 핸들러가 부르는 결제 동작 네 가지(식별·오퍼링·결제·복원)를 웹 메시지 모양으로 돌려준다.
// 유료 여부는 여기서 판단하지 않는다. 영수증은 RevenueCat이 검증하고 BE 웹훅이 구독 상태를 갖는다 (docs/subscription.md)
import { Platform } from 'react-native';
import type {
  OfferingPackage,
  PurchaseStatus,
  RestoreStatus,
} from '@landit/bridge';
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  type PurchasesOfferings,
} from 'react-native-purchases';

/** 셸이 웹에 회신하는 결과 — 실패(error)일 때만 사용자에게 보여줄 문구가 붙는다 */
export interface Outcome<Status extends string> {
  status: Status;
  message?: string;
}
export type PurchaseOutcome = Outcome<PurchaseStatus>;
export type RestoreOutcome = Outcome<RestoreStatus>;

// 공개 SDK 키 — 번들에 들어가도 되는 값이라 EXPO_PUBLIC_로 받는다. 리터럴로 접근해야 빌드 시 치환된다
const ENV_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
};

/**
 * 플랫폼에 맞는 RevenueCat 공개 키를 고른다.
 *
 * @returns 키 문자열. 비어 있으면(로컬 dev 빌드) null
 */
export const resolveApiKey = (
  os: string,
  keys: { ios?: string; android?: string } = ENV_KEYS,
): string | null => {
  const key = (os === 'ios' ? keys.ios : keys.android)?.trim();
  return key ? key : null;
};

let configured = false;
// 진행 중인 logIn/logOut — 결제·복원·오퍼링은 이게 끝난 뒤에 간다. 브릿지 핸들러는 메시지마다 따로 돌아 순서를 보장하지 않는다
let identifying: Promise<unknown> = Promise.resolve();

const NOT_CONFIGURED_MESSAGE = '결제를 사용할 수 없는 빌드예요.';

/**
 * 앱 시작 시 한 번 SDK를 켠다.
 *
 * @param apiKey 없으면(로컬 dev 등) 켜지 않고, 이후 결제 요청은 실패로 회신한다
 * @returns SDK를 켰는지
 */
export const configurePurchases = (
  apiKey: string | null = resolveApiKey(Platform.OS),
): boolean => {
  if (!apiKey) {
    configured = false;
    return false;
  }
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
  configured = true;
  return true;
};

/**
 * 로그인 사용자를 RevenueCat 사용자로 묶는다 — 웹훅의 app_user_id가 이 값이 된다.
 *
 * @param userId RevenueCat app_user_id. null이면 로그아웃
 */
export const identifyUser = async (userId: string | null): Promise<void> => {
  if (!configured) return;
  identifying = userId ? Purchases.logIn(userId) : Purchases.logOut();
  await identifying;
};

// 식별이 끝나길 기다린다. 식별이 실패해도 결제는 막지 않는다 — 그 결과는 웹훅 매칭에서 드러난다
const afterIdentify = () => identifying.catch(() => undefined);

const PLAN_BY_PACKAGE_TYPE: Partial<Record<string, OfferingPackage['plan']>> = {
  [PACKAGE_TYPE.MONTHLY]: 'monthly',
  [PACKAGE_TYPE.ANNUAL]: 'yearly',
};

/** RevenueCat 오퍼링을 웹 메시지 모양으로 — 월간·연간만 싣고 그 밖의 주기는 버린다 */
export const toOfferingPackages = (
  offerings: PurchasesOfferings,
): OfferingPackage[] =>
  (offerings.current?.availablePackages ?? []).flatMap((pkg) => {
    const plan = PLAN_BY_PACKAGE_TYPE[pkg.packageType];
    if (!plan) return [];
    return [
      {
        id: pkg.identifier,
        plan,
        price: pkg.product.price,
        currency: pkg.product.currencyCode,
      },
    ];
  });

/** 현재 오퍼링의 패키지 목록. 조회 실패는 빈 목록 — 웹은 등록값 표시를 그대로 쓴다 */
export const fetchOfferingPackages = async (): Promise<OfferingPackage[]> => {
  if (!configured) return [];
  await afterIdentify();
  try {
    return toOfferingPackages(await Purchases.getOfferings());
  } catch {
    return [];
  }
};

// RevenueCat 오류는 Error일 수도, message만 있는 객체일 수도 있다 — 문자열 message가 있으면 그대로 쓴다
const toErrorMessage = (error: unknown) => {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === 'string' && message
    ? message
    : '결제 중 문제가 생겼어요.';
};

// 사용자가 시트를 닫은 것(userCancelled)은 실패가 아니라 취소다
const isUserCancelled = (error: unknown) =>
  (error as { userCancelled?: unknown } | null)?.userCancelled === true;

/**
 * 패키지 하나를 결제한다 — 스토어 결제 시트가 뜬다.
 *
 * @param packageId 오퍼링 안의 RevenueCat 패키지 identifier
 * @returns success / cancelled / error. 오퍼링에 없는 id는 스토어를 부르지 않고 error
 */
export const purchasePackage = async (
  packageId: string,
): Promise<PurchaseOutcome> => {
  if (!configured) return { status: 'error', message: NOT_CONFIGURED_MESSAGE };
  await afterIdentify();
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find(
      (candidate) => candidate.identifier === packageId,
    );
    if (!pkg) {
      return { status: 'error', message: '지금은 살 수 없는 상품이에요.' };
    }
    await Purchases.purchasePackage(pkg);
    return { status: 'success' };
  } catch (error) {
    if (isUserCancelled(error)) return { status: 'cancelled' };
    return { status: 'error', message: toErrorMessage(error) };
  }
};

/** 이전 구매를 복원한다. 복원할 게 없어도 success다 — 유료 여부는 BE가 판단한다 */
export const restorePurchases = async (): Promise<RestoreOutcome> => {
  if (!configured) return { status: 'error', message: NOT_CONFIGURED_MESSAGE };
  await afterIdentify();
  try {
    await Purchases.restorePurchases();
    return { status: 'success' };
  } catch (error) {
    return { status: 'error', message: toErrorMessage(error) };
  }
};
