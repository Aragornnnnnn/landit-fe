// 셸에 시키는 결제 동작의 계약 — 환경 판정 세 갈래, 요청마다 기다리는 회신과 제한 시간, 사용자 id 변환
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchOfferingsViaBridge,
  identifyViaBridge,
  OFFERINGS_TIMEOUT_MS,
  PURCHASE_BRIDGE_VERSION,
  PURCHASE_TIMEOUT_MS,
  purchaseViaBridge,
  resolvePurchaseSupport,
  RESTORE_TIMEOUT_MS,
  restoreViaBridge,
  toRevenueCatUserId,
} from './shell-purchases';

const mocks = vi.hoisted(() => ({
  requestFromNative: vi.fn(),
  postToNative: vi.fn(),
  getNativeContext: vi.fn(),
}));

vi.mock('@/shared/bridge/request', () => ({
  requestFromNative: mocks.requestFromNative,
}));
vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: mocks.postToNative,
}));
vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContext: mocks.getNativeContext,
}));

const shell = (bridgeVersion: number) => ({
  platform: 'ios' as const,
  appVersion: '1.3.0',
  buildNumber: '6',
  bridgeVersion,
});

beforeEach(() => vi.clearAllMocks());

describe('resolvePurchaseSupport', () => {
  it('셸 컨텍스트가 없으면(일반 브라우저) 결제할 수 없다', () => {
    expect(resolvePurchaseSupport(null)).toBe('browser');
  });

  it('결제 메시지를 모르는 구버전 셸은 앱 업데이트가 필요하다', () => {
    expect(resolvePurchaseSupport(shell(PURCHASE_BRIDGE_VERSION - 1))).toBe(
      'outdated-shell',
    );
  });

  it('결제 메시지를 아는 셸이면 준비된 것이다', () => {
    expect(resolvePurchaseSupport(shell(PURCHASE_BRIDGE_VERSION))).toBe(
      'ready',
    );
    expect(resolvePurchaseSupport(shell(PURCHASE_BRIDGE_VERSION + 3))).toBe(
      'ready',
    );
  });

  it('인자를 안 주면 현재 창의 셸 컨텍스트로 판정한다', () => {
    mocks.getNativeContext.mockReturnValue(shell(PURCHASE_BRIDGE_VERSION));

    expect(resolvePurchaseSupport()).toBe('ready');
  });
});

describe('셸 왕복 요청', () => {
  it.each([
    {
      name: '결제',
      send: () => purchaseViaBridge('$rc_annual'),
      request: { type: 'PURCHASE', packageId: '$rc_annual' },
      replyType: 'PURCHASE_RESULT',
      timeoutMs: PURCHASE_TIMEOUT_MS,
    },
    {
      name: '복원',
      send: () => restoreViaBridge(),
      request: { type: 'RESTORE_PURCHASES' },
      replyType: 'RESTORE_RESULT',
      timeoutMs: RESTORE_TIMEOUT_MS,
    },
    {
      name: '오퍼링 조회',
      send: () => fetchOfferingsViaBridge(),
      request: { type: 'GET_OFFERINGS' },
      replyType: 'OFFERINGS',
      timeoutMs: OFFERINGS_TIMEOUT_MS,
    },
  ])(
    '$name은 정해진 요청·회신 종류·제한 시간으로 왕복한다',
    ({ send, request, replyType, timeoutMs }) => {
      send();

      expect(mocks.requestFromNative).toHaveBeenCalledWith({
        request,
        replyType,
        timeoutMs,
        signal: undefined,
      });
    },
  );

  it('결제 시트는 다른 왕복보다 훨씬 오래 기다린다 — 사용자가 시트를 붙잡고 있을 수 있다', () => {
    expect(PURCHASE_TIMEOUT_MS).toBeGreaterThan(RESTORE_TIMEOUT_MS);
    expect(RESTORE_TIMEOUT_MS).toBeGreaterThan(OFFERINGS_TIMEOUT_MS);
  });
});

describe('identifyViaBridge', () => {
  it('회신을 기다리지 않고 IDENTIFY만 보낸다', () => {
    identifyViaBridge('42');

    expect(mocks.postToNative).toHaveBeenCalledWith({
      type: 'IDENTIFY',
      userId: '42',
    });
    expect(mocks.requestFromNative).not.toHaveBeenCalled();
  });
});

describe('toRevenueCatUserId', () => {
  it('회원 id를 문자열로, 회원이 없으면 null로 바꾼다', () => {
    expect(toRevenueCatUserId({ userId: 42 })).toBe('42');
    expect(toRevenueCatUserId(null)).toBeNull();
    expect(toRevenueCatUserId(undefined)).toBeNull();
  });
});
