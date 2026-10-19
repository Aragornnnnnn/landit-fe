'use client';

// 셸에 시킬 수 있는 앱 안 별점 카드 요청과 그 허용 조건 — 리뷰 시트가 셸과 주고받는 것은 전부 이 파일을 거친다
import { getNativeContext } from '@/shared/bridge/native-context';
import { requestFromNative } from '@/shared/bridge/request';

/** REQUEST_REVIEW ↔ REVIEW_RESULT를 알아듣는 최소 브릿지 계약 버전 */
export const REVIEW_CARD_BRIDGE_VERSION = 9;

/** 카드를 시킬 수 있는 환경인가 — ready가 아니면 지금처럼 스토어 리뷰 화면으로 보낸다 */
export type ReviewCardSupport = 'ready' | 'browser' | 'outdated-shell';

export const resolveReviewCardSupport = (
  context = getNativeContext(),
): ReviewCardSupport => {
  if (!context) return 'browser';
  if (context.bridgeVersion < REVIEW_CARD_BRIDGE_VERSION)
    return 'outdated-shell';
  return 'ready';
};

// 셸은 늦어도 iOS 0.5초·Android 1초 안에 답한다 — 그보다 조금 더 기다려 셸이 답할 틈을 준다
export const REVIEW_CARD_TIMEOUT_MS = 1500;

/**
 * 앱 안 별점 카드를 청한다. 회신은 shown·not_shown·unavailable 중 하나고, 못 받으면 null이다.
 *
 * @param signal 화면이 사라질 때 끊는 용도. 끊기면 null로 끝난다
 */
export const requestReviewCardViaBridge = (signal?: AbortSignal) =>
  requestFromNative({
    request: { type: 'REQUEST_REVIEW' },
    replyType: 'REVIEW_RESULT',
    timeoutMs: REVIEW_CARD_TIMEOUT_MS,
    signal,
  });
