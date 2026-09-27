// 페이월 게이트 판정 — 유료·결제 불가 환경·미확정 상태를 한 함수에서 가른다 (docs/subscription.md 「무료 구간과 페이월 게이트」)
import { describe, expect, it } from 'vitest';

import {
  canLockPaywall,
  decidePaywallGate,
  type PaywallGateInput,
} from './paywall-gate';

describe('canLockPaywall', () => {
  it('결제 플래그가 켜져 있고 1.3.0 이상 앱이면 잠글 수 있다', () => {
    expect(canLockPaywall({ paymentEnabled: true, appVersion: '1.3.0' })).toBe(
      true,
    );
  });

  it('결제 플래그가 꺼져 있으면 잠그지 않는다 — 심사 뒤 오픈 전까지의 상태', () => {
    expect(canLockPaywall({ paymentEnabled: false, appVersion: '1.3.0' })).toBe(
      false,
    );
  });

  it('브라우저(앱 버전 없음)는 잠그지 않는다 — 결제할 수 없는 곳에서 막으면 갈 데가 없다', () => {
    expect(canLockPaywall({ paymentEnabled: true, appVersion: null })).toBe(
      false,
    );
  });

  it('1.3.0 미만 앱은 브릿지 버전과 무관하게 잠그지 않는다', () => {
    expect(canLockPaywall({ paymentEnabled: true, appVersion: '1.2.5' })).toBe(
      false,
    );
  });
});

describe('decidePaywallGate', () => {
  const base: PaywallGateInput = { lockable: true, premium: false };

  it('무료 사용자는 학습 문이 잠긴다 — 대화를 몇 번 했든 표현 학습·스몰톡은 유료다', () => {
    expect(decidePaywallGate(base)).toBe('locked');
  });

  it('유료(체험 포함)면 열려 있다', () => {
    expect(decidePaywallGate({ ...base, premium: true })).toBe('open');
  });

  it('잠글 수 없는 환경이면 무료여도 열려 있다', () => {
    expect(decidePaywallGate({ ...base, lockable: false })).toBe('open');
  });

  it('유료 여부를 모르면 미확정이다 — 모르는 채로 잠그지 않는다', () => {
    expect(decidePaywallGate({ ...base, premium: null })).toBe('unknown');
  });

  it('결제 불가 환경에서는 모르는 값이 있어도 열려 있다 — 어차피 잠글 수 없다', () => {
    expect(decidePaywallGate({ lockable: false, premium: null })).toBe('open');
  });
});
