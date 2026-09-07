// 결제를 시킬 수 있는 환경인지 판정 — 브라우저·구버전 셸·준비된 셸 세 갈래
import { describe, expect, it } from 'vitest';

import {
  PURCHASE_BRIDGE_VERSION,
  resolvePurchaseSupport,
} from './purchase-support';

const shell = (bridgeVersion: number) => ({
  platform: 'ios' as const,
  appVersion: '1.3.0',
  buildNumber: '6',
  bridgeVersion,
});

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
});
