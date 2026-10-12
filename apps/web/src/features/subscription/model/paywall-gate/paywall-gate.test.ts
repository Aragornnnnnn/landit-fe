// 페이월 게이트 판정 — 유료·결제 불가 환경·미확정 상태를 한 함수에서 가른다 (docs/subscription.md 「무료 구간과 페이월 게이트」)
import { describe, expect, it } from 'vitest';

import {
  decidePaywallGate,
  isPaymentLive,
  isRewardChallengeLive,
  type PaywallGateInput,
} from './paywall-gate';

describe('isPaymentLive', () => {
  it('결제 플래그가 켜져 있고 앱 안이면 잠글 수 있다', () => {
    expect(isPaymentLive({ paymentEnabled: true, inApp: true })).toBe(true);
  });

  it('결제 플래그가 꺼져 있으면 잠그지 않는다 — 결제를 막아 둔 동안은 학습 문도 열어 둔다', () => {
    expect(isPaymentLive({ paymentEnabled: false, inApp: true })).toBe(false);
  });

  it('브라우저는 잠그지 않는다 — 결제할 수 없는 곳에서 막으면 갈 데가 없다', () => {
    expect(isPaymentLive({ paymentEnabled: true, inApp: false })).toBe(false);
  });
});

describe('isRewardChallengeLive', () => {
  const shell = (platform: 'ios' | 'android', appVersion: string) => ({
    platform,
    appVersion,
    buildNumber: '18',
    bridgeVersion: 8,
  });

  it('스위치가 켜져 있고 환급 상품이 실린 iOS 버전이면 환급이 열린다', () => {
    expect(
      isRewardChallengeLive({
        rewardEnabled: true,
        context: shell('ios', '1.4.0'),
      }),
    ).toBe(true);
  });

  it('그보다 낮은 iOS 버전에는 열지 않는다 — 심사 전 상품이 기존 사용자에게 보이면 결제가 실패한다', () => {
    expect(
      isRewardChallengeLive({
        rewardEnabled: true,
        context: shell('ios', '1.3.3'),
      }),
    ).toBe(false);
  });

  it('최소 버전을 적지 않은 플랫폼에는 버전이 높아도 열지 않는다', () => {
    expect(
      isRewardChallengeLive({
        rewardEnabled: true,
        context: shell('android', '1.4.0'),
      }),
    ).toBe(false);
  });

  it('브라우저에는 열지 않는다', () => {
    expect(isRewardChallengeLive({ rewardEnabled: true, context: null })).toBe(
      false,
    );
  });

  it('스위치가 꺼져 있으면 어느 앱에도 열지 않는다', () => {
    expect(
      isRewardChallengeLive({
        rewardEnabled: false,
        context: shell('ios', '1.4.0'),
      }),
    ).toBe(false);
  });
});

describe('decidePaywallGate', () => {
  const base: PaywallGateInput = { paymentLive: true, premium: false };

  it('무료 사용자는 학습 문이 잠긴다 — 대화를 몇 번 했든 표현 학습·스몰톡은 유료다', () => {
    expect(decidePaywallGate(base)).toBe('locked');
  });

  it('유료(체험 포함)면 열려 있다', () => {
    expect(decidePaywallGate({ ...base, premium: true })).toBe('open');
  });

  it('결제가 열리지 않은 환경이면 무료여도 열려 있다', () => {
    expect(decidePaywallGate({ ...base, paymentLive: false })).toBe('open');
  });

  it('유료 여부를 모르면 미확정이다 — 모르는 채로 잠그지 않는다', () => {
    expect(decidePaywallGate({ ...base, premium: null })).toBe('unknown');
  });

  it('결제 불가 환경에서는 모르는 값이 있어도 열려 있다 — 어차피 잠글 수 없다', () => {
    expect(decidePaywallGate({ paymentLive: false, premium: null })).toBe(
      'open',
    );
  });
});
