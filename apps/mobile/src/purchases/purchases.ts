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
  type PurchasesPackage,
} from 'react-native-purchases';

export interface PurchaseOutcome {
  status: PurchaseStatus;
  message?: string;
}

export interface RestoreOutcome {
  status: RestoreStatus;
  message?: string;
}

// 공개 SDK 키 — 번들에 들어가도 되는 값이라 EXPO_PUBLIC_로 받는다. 리터럴로 접근해야 빌드 시 치환된다
const ENV_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
};

export const resolveApiKey = (
  os: string,
  keys: { ios?: string; android?: string } = ENV_KEYS,
): string | null => {
  const key = (os === 'ios' ? keys.ios : keys.android)?.trim();
  return key ? key : null;
};

let configured = false;

// 앱 시작 시 한 번. 키가 없으면(로컬 dev 등) 끄고, 결제 요청은 실패로 회신한다
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

const NOT_CONFIGURED_MESSAGE = '결제를 사용할 수 없는 빌드예요.';

// 로그인 사용자를 RevenueCat 사용자로 묶는다 — 웹훅의 app_user_id가 이 값이 된다. null은 로그아웃
export const identifyUser = async (userId: string | null) => {
  if (!configured) return;
  if (userId) await Purchases.logIn(userId);
  else await Purchases.logOut();
};

const PLAN_BY_PACKAGE_TYPE: Partial<Record<string, OfferingPackage['plan']>> = {
  [PACKAGE_TYPE.MONTHLY]: 'monthly',
  [PACKAGE_TYPE.ANNUAL]: 'yearly',
};

// RevenueCat 패키지를 웹 메시지 모양으로 — 월간·연간만 싣고 그 밖의 주기는 버린다
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
        priceString: pkg.product.priceString,
      },
    ];
  });

const currentPackages = async (): Promise<PurchasesPackage[]> => {
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages ?? [];
};

// 조회 실패는 빈 목록 — 웹은 기본 표시값을 그대로 쓴다
export const fetchOfferingPackages = async (): Promise<OfferingPackage[]> => {
  if (!configured) return [];
  try {
    return toOfferingPackages(await Purchases.getOfferings());
  } catch {
    return [];
  }
};

const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String((error as { message: unknown }).message)
      : '결제 중 문제가 생겼어요.';

// 사용자가 시트를 닫은 것(userCancelled)은 실패가 아니라 취소다
const isUserCancelled = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'userCancelled' in error &&
  (error as { userCancelled?: boolean }).userCancelled === true;

export const purchasePackage = async (
  packageId: string,
): Promise<PurchaseOutcome> => {
  if (!configured) return { status: 'error', message: NOT_CONFIGURED_MESSAGE };
  try {
    const pkg = (await currentPackages()).find(
      (candidate) => candidate.identifier === packageId,
    );
    if (!pkg) {
      return { status: 'error', message: '지금은 살 수 없는 상품이에요.' };
    }
    await Purchases.purchasePackage(pkg);
    return { status: 'success' };
  } catch (error) {
    if (isUserCancelled(error)) return { status: 'cancelled' };
    return { status: 'error', message: errorMessage(error) };
  }
};

export const restorePurchases = async (): Promise<RestoreOutcome> => {
  if (!configured) return { status: 'error', message: NOT_CONFIGURED_MESSAGE };
  try {
    await Purchases.restorePurchases();
    return { status: 'success' };
  } catch (error) {
    return { status: 'error', message: errorMessage(error) };
  }
};
