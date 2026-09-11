// RevenueCat 래퍼의 갈림길 — 키 없을 때 비활성, 패키지 매핑, 취소와 실패 구분, 로그인·로그아웃 위임과 그 뒤에 가는 결제
import Purchases, { PACKAGE_TYPE } from 'react-native-purchases';

import { reportError, reportWarning } from '../monitoring/report';
import {
  configurePurchases,
  fetchOfferingPackages,
  identifyUser,
  purchasePackage,
  resolveApiKey,
  restorePurchases,
  toOfferingPackages,
} from './purchases';

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    logIn: jest.fn(() => Promise.resolve({})),
    logOut: jest.fn(() => Promise.resolve({})),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(() => Promise.resolve({})),
  },
  PACKAGE_TYPE: { MONTHLY: 'MONTHLY', ANNUAL: 'ANNUAL', WEEKLY: 'WEEKLY' },
  LOG_LEVEL: { DEBUG: 'DEBUG', INFO: 'INFO' },
}));

jest.mock('../monitoring/report', () => ({
  reportError: jest.fn(),
  reportWarning: jest.fn(),
}));

const mockPurchases = Purchases as jest.Mocked<typeof Purchases>;

const monthly = {
  identifier: '$rc_monthly',
  packageType: PACKAGE_TYPE.MONTHLY,
  product: { price: 9900, currencyCode: 'KRW' },
};
const annual = {
  identifier: '$rc_annual',
  packageType: PACKAGE_TYPE.ANNUAL,
  product: { price: 59900, currencyCode: 'KRW' },
};
const weekly = {
  identifier: '$rc_weekly',
  packageType: PACKAGE_TYPE.WEEKLY,
  product: { price: 3000, currencyCode: 'KRW' },
};

// 체인으로 이어진 식별이 실제 SDK 호출까지 가도록 마이크로태스크를 비운다
const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

const offeringsWith = (packages: unknown[]) =>
  ({ current: { availablePackages: packages } }) as never;

describe('resolveApiKey', () => {
  it('플랫폼에 맞는 공개 SDK 키를 고르고 없으면 null이다', () => {
    expect(
      resolveApiKey('ios', { ios: ' ios-key ', android: 'android-key' }),
    ).toBe('ios-key');
    expect(
      resolveApiKey('android', { ios: 'ios-key', android: '' }),
    ).toBeNull();
  });
});

describe('configurePurchases', () => {
  it('키가 없으면 SDK를 켜지 않고 false를 돌려준다 — 결제 요청은 실패로 회신된다', async () => {
    expect(configurePurchases(null)).toBe(false);
    expect(mockPurchases.configure).not.toHaveBeenCalled();

    const result = await purchasePackage('$rc_annual');

    expect(result.status).toBe('error');
  });

  it('키가 있으면 SDK를 켠다', () => {
    expect(configurePurchases('key')).toBe(true);
    expect(mockPurchases.configure).toHaveBeenCalledWith({ apiKey: 'key' });
  });
});

describe('identifyUser', () => {
  beforeEach(() => {
    configurePurchases('key');
  });

  it('userId가 있으면 logIn, null이면 logOut으로 위임한다', async () => {
    await identifyUser('42');
    expect(mockPurchases.logIn).toHaveBeenCalledWith('42');

    await identifyUser(null);
    expect(mockPurchases.logOut).toHaveBeenCalledTimes(1);
  });

  it('식별이 진행 중이면 결제는 그것이 끝난 뒤에 간다 — 익명 사용자로 결제되지 않게', async () => {
    let finishLogIn: () => void = () => {};
    mockPurchases.logIn.mockReturnValueOnce(
      new Promise((resolve) => {
        finishLogIn = () => resolve({} as never);
      }),
    );
    mockPurchases.getOfferings.mockResolvedValue(offeringsWith([annual]));
    mockPurchases.purchasePackage.mockResolvedValueOnce({} as never);

    void identifyUser('42');
    const pending = purchasePackage('$rc_annual');
    await flushMicrotasks();
    expect(mockPurchases.getOfferings).not.toHaveBeenCalled();

    finishLogIn();
    await expect(pending).resolves.toEqual({ status: 'success' });
    expect(mockPurchases.purchasePackage).toHaveBeenCalledWith(annual);
  });

  it('식별이 연달아 오면 순서대로 처리하고, 결제는 마지막 식별까지 끝난 뒤에 간다', async () => {
    let finishA: () => void = () => {};
    mockPurchases.logIn
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finishA = () => resolve({} as never);
        }),
      )
      .mockResolvedValueOnce({} as never);
    mockPurchases.getOfferings.mockResolvedValue(offeringsWith([annual]));
    mockPurchases.purchasePackage.mockResolvedValueOnce({} as never);

    void identifyUser('A');
    void identifyUser('B');
    const pending = purchasePackage('$rc_annual');
    await flushMicrotasks();
    // B는 A가 끝나기 전엔 시작하지 않고, 결제도 기다린다
    expect(mockPurchases.logIn).toHaveBeenCalledTimes(1);
    expect(mockPurchases.logIn).toHaveBeenCalledWith('A');
    expect(mockPurchases.getOfferings).not.toHaveBeenCalled();

    finishA();
    await expect(pending).resolves.toEqual({ status: 'success' });
    expect(mockPurchases.logIn).toHaveBeenNthCalledWith(2, 'B');
  });

  it('식별이 실패해도 결제는 막지 않는다', async () => {
    mockPurchases.logIn.mockRejectedValueOnce(new Error('network'));
    mockPurchases.getOfferings.mockResolvedValue(offeringsWith([annual]));
    mockPurchases.purchasePackage.mockResolvedValueOnce({} as never);

    await identifyUser('42').catch(() => undefined);

    await expect(purchasePackage('$rc_annual')).resolves.toEqual({
      status: 'success',
    });
  });
});

describe('toOfferingPackages', () => {
  it('월간·연간 패키지만 plan을 붙여 옮기고 그 밖의 주기는 버린다', () => {
    const packages = toOfferingPackages(
      offeringsWith([monthly, weekly, annual]),
    );

    expect(packages).toEqual([
      { id: '$rc_monthly', plan: 'monthly', price: 9900, currency: 'KRW' },
      { id: '$rc_annual', plan: 'yearly', price: 59900, currency: 'KRW' },
    ]);
  });

  it('현재 오퍼링이 없으면 빈 배열이다', () => {
    expect(toOfferingPackages({ current: null } as never)).toEqual([]);
  });
});

describe('fetchOfferingPackages', () => {
  beforeEach(() => {
    configurePurchases('key');
  });

  it('스토어 조회가 실패하면 빈 배열로 끝내고 warning으로 보고한다 — 웹은 기본 표시값을 유지한다', async () => {
    const error = new Error('offline');
    mockPurchases.getOfferings.mockRejectedValueOnce(error);

    await expect(fetchOfferingPackages()).resolves.toEqual([]);
    expect(reportWarning).toHaveBeenCalledWith(error);
  });
});

describe('purchasePackage', () => {
  beforeEach(() => {
    configurePurchases('key');
    mockPurchases.getOfferings.mockResolvedValue(
      offeringsWith([monthly, annual]),
    );
  });

  it('id로 찾은 패키지를 결제하고 성공을 돌려준다', async () => {
    mockPurchases.purchasePackage.mockResolvedValueOnce({} as never);

    const result = await purchasePackage('$rc_annual');

    expect(mockPurchases.purchasePackage).toHaveBeenCalledWith(annual);
    expect(result).toEqual({ status: 'success' });
  });

  it('사용자가 결제 시트를 닫으면 취소다 — 실패가 아니다', async () => {
    mockPurchases.purchasePackage.mockRejectedValueOnce({
      userCancelled: true,
      message: 'Purchase was cancelled.',
    });

    await expect(purchasePackage('$rc_annual')).resolves.toEqual({
      status: 'cancelled',
    });
    expect(reportError).not.toHaveBeenCalled();
  });

  it('그 밖의 오류는 실패이고 사유를 붙이며, 어떤 패키지였는지와 함께 보고한다', async () => {
    const error = {
      userCancelled: false,
      message: 'The device or user is not allowed to make the purchase.',
    };
    mockPurchases.purchasePackage.mockRejectedValueOnce(error);

    const result = await purchasePackage('$rc_annual');

    expect(result.status).toBe('error');
    expect(result.message).toContain('not allowed');
    expect(reportError).toHaveBeenCalledWith(error, {
      packageId: '$rc_annual',
    });
  });

  it('오퍼링에 없는 패키지 id면 스토어를 부르지 않고 실패로 끝내며 설정 결함으로 보고한다', async () => {
    const result = await purchasePackage('$rc_lifetime');

    expect(mockPurchases.purchasePackage).not.toHaveBeenCalled();
    expect(result.status).toBe('error');
    expect(reportError).toHaveBeenCalledWith(expect.any(Error), {
      packageId: '$rc_lifetime',
    });
  });
});

describe('restorePurchases', () => {
  beforeEach(() => {
    configurePurchases('key');
  });

  it('복원이 끝나면 성공, 실패하면 사유를 붙이고 보고한다 — 유료 사용자가 권한을 되찾지 못하는 상황', async () => {
    await expect(restorePurchases()).resolves.toEqual({ status: 'success' });

    const error = new Error('network');
    mockPurchases.restorePurchases.mockRejectedValueOnce(error);
    const failed = await restorePurchases();

    expect(failed.status).toBe('error');
    expect(failed.message).toBe('network');
    expect(reportError).toHaveBeenCalledWith(error);
  });
});
