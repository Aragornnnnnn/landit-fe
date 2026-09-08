// 페이월 게이트 판정 — 무료 구간·유료·결제 불가 환경·미확정 상태를 한 함수에서 가른다 (docs/subscription.md 「무료 구간과 페이월 게이트」)
import { describe, expect, it } from 'vitest';

import { decidePaywallGate, type PaywallGateInput } from './paywall-gate';

const base: PaywallGateInput = {
  paymentEnabled: true,
  appVersion: '1.3.0',
  premium: false,
  conversationCompletedSinceLaunch: true,
};

describe('decidePaywallGate', () => {
  it('오픈 뒤 대화를 하나 끝낸 무료 사용자는 잠긴다 — 무료는 대화 하나까지다', () => {
    expect(decidePaywallGate(base)).toBe('locked');
  });

  it('오픈 뒤 대화를 아직 안 끝냈으면 열려 있다 — 기존 사용자도 오늘 대화 하나는 한다', () => {
    expect(
      decidePaywallGate({ ...base, conversationCompletedSinceLaunch: false }),
    ).toBe('open');
  });

  it('유료(체험 포함)면 언제나 열려 있다', () => {
    expect(decidePaywallGate({ ...base, premium: true })).toBe('open');
  });

  it('결제 플래그가 꺼져 있으면 잠그지 않는다 — 심사 뒤 오픈 전까지의 상태', () => {
    expect(decidePaywallGate({ ...base, paymentEnabled: false })).toBe('open');
  });

  it('브라우저(앱 버전 없음)는 잠그지 않는다 — 결제할 수 없는 곳에서 막으면 갈 데가 없다', () => {
    expect(decidePaywallGate({ ...base, appVersion: null })).toBe('open');
  });

  it('1.3.0 미만 앱은 브릿지 버전과 무관하게 잠그지 않는다', () => {
    expect(decidePaywallGate({ ...base, appVersion: '1.2.5' })).toBe('open');
  });

  it('유료 여부나 완료 여부를 아직 모르면 미확정이다 — 화면은 진입을 잠시 보류한다', () => {
    expect(decidePaywallGate({ ...base, premium: null })).toBe('unknown');
    expect(
      decidePaywallGate({ ...base, conversationCompletedSinceLaunch: null }),
    ).toBe('unknown');
  });

  it('결제 불가 환경에서는 모르는 값이 있어도 열려 있다 — 어차피 잠글 수 없다', () => {
    expect(
      decidePaywallGate({ ...base, appVersion: null, premium: null }),
    ).toBe('open');
  });
});
