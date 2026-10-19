// 투어 끝의 페이월 주소 — 페이월은 이 문(source)으로 온 것만 투어를 끝낸 것으로 친다
import type { PaywallSource } from '@landit/analytics';

import { paywallPath } from '@/shared/lib/routes';

export const TOUR_PAYWALL_SOURCE =
  'first_expression_tour' satisfies PaywallSource;

export const tourPaywallPath = () =>
  paywallPath({ source: TOUR_PAYWALL_SOURCE });
