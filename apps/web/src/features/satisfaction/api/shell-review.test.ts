// shell-review — 앱 안 별점 카드를 셸에 시킬 수 있는 환경 판정과 왕복 계약 검증
import { describe, expect, it, vi } from 'vitest';

import { requestFromNative } from '@/shared/bridge/request';

import {
  requestReviewCardViaBridge,
  resolveReviewCardSupport,
  REVIEW_CARD_BRIDGE_VERSION,
  REVIEW_CARD_TIMEOUT_MS,
} from './shell-review';

vi.mock('@/shared/bridge/request', () => ({ requestFromNative: vi.fn() }));
const requestFromNativeMock = vi.mocked(requestFromNative);

const shell = (bridgeVersion: number) => ({
  platform: 'ios' as const,
  appVersion: '1.4.0',
  buildNumber: '20',
  bridgeVersion,
});

describe('resolveReviewCardSupport', () => {
  it('셸이 없으면(브라우저) 카드를 시킬 수 없다', () => {
    expect(resolveReviewCardSupport(null)).toBe('browser');
  });

  it('REQUEST_REVIEW를 모르는 구 셸이면 시킬 수 없다', () => {
    expect(
      resolveReviewCardSupport(shell(REVIEW_CARD_BRIDGE_VERSION - 1)),
    ).toBe('outdated-shell');
  });

  it('계약 버전을 맞춘 셸이면 시킬 수 있다', () => {
    expect(resolveReviewCardSupport(shell(REVIEW_CARD_BRIDGE_VERSION))).toBe(
      'ready',
    );
  });
});

describe('requestReviewCardViaBridge', () => {
  it('REQUEST_REVIEW를 보내고 REVIEW_RESULT를 짧게 기다린다 — 카드는 0.5초 안에 뜨거나 안 뜬다', async () => {
    requestFromNativeMock.mockResolvedValue({
      type: 'REVIEW_RESULT',
      status: 'shown',
    });

    const reply = await requestReviewCardViaBridge();

    expect(requestFromNativeMock).toHaveBeenCalledWith({
      request: { type: 'REQUEST_REVIEW' },
      replyType: 'REVIEW_RESULT',
      timeoutMs: REVIEW_CARD_TIMEOUT_MS,
      signal: undefined,
    });
    expect(reply?.status).toBe('shown');
  });
});
