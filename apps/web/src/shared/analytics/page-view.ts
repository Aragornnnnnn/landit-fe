// 경로 → Page Viewed 속성 매핑 — 동적 세그먼트는 page_name으로 정규화하고 id는 속성으로 뺀다 (정책 2-2)
import type { EventProps } from '@landit/analytics';

type PageViewProps = EventProps['Page Viewed'];

// 계측 제외 — 루트는 즉시 redirect, 나머지는 개발용 화면
const EXCLUDED = new Set(['/', '/stt-demo', '/dev']);

const STATIC_PAGES = new Set(['login', 'onboarding', 'me', 'privacy', 'terms']);

const toId = (raw: string | null) => {
  const id = Number(raw);
  return raw && Number.isFinite(id) ? id : undefined;
};

export const toPageView = (
  pathname: string,
  searchParams: URLSearchParams,
): PageViewProps | null => {
  if (EXCLUDED.has(pathname)) return null;

  const seg = pathname.split('/').filter(Boolean);

  if (pathname === '/home') {
    const base: PageViewProps = { page_name: 'home', path: pathname };
    // 복귀 신호 우선순위 — flip(표현 완료 복귀) > card(중도 이탈 복귀) > just(해금 직후)
    if (searchParams.has('flip')) {
      return {
        ...base,
        return_reason: 'flip',
        scenario_id: toId(searchParams.get('flip')),
      };
    }
    if (searchParams.has('card')) {
      return {
        ...base,
        return_reason: 'card',
        scenario_id: toId(searchParams.get('card')),
      };
    }
    if (searchParams.has('just')) return { ...base, return_reason: 'just' };
    return base;
  }

  if (seg[0] === 'conversation' && seg[1]) {
    return {
      page_name: 'conversation',
      path: pathname,
      scenario_id: toId(seg[1]),
    };
  }

  if (seg[0] === 'expressions' && seg[1] && seg[2]) {
    if (seg[2] === 'branch') {
      return {
        page_name: 'expression_branch',
        path: pathname,
        scenario_id: toId(seg[1]),
      };
    }
    return {
      page_name: 'expression_learning',
      path: pathname,
      scenario_id: toId(seg[1]),
      expression_id: toId(seg[2]),
    };
  }

  if (seg[0] === 'auth') return { page_name: 'auth_callback', path: pathname };

  if (seg.length === 1 && STATIC_PAGES.has(seg[0])) {
    return { page_name: seg[0], path: pathname };
  }

  return { page_name: pathname, path: pathname };
};
