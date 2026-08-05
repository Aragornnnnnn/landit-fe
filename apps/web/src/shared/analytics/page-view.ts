// 경로 → Page Viewed 속성 매핑 — 동적 세그먼트는 page_name으로 정규화하고 id는 속성으로 뺀다 (정책 2-2)
import type { EventProps } from '@landit/analytics';

type PageViewProps = EventProps['Page Viewed'];

// 계측 제외 — 루트는 즉시 redirect라 페이지뷰로 의미가 없다
const EXCLUDED = new Set(['/']);

const STATIC_PAGES = new Set([
  'login',
  'onboarding',
  'me',
  'privacy',
  'terms',
  'smalltalk',
  'streak',
]);

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

  if (pathname === '/scenario') {
    const base: PageViewProps = { page_name: 'scenario', path: pathname };
    // 복귀 신호는 flip(표현 완료 복귀)과 reminder(알림 탭 유입) 둘이다.
    // card·just는 목록을 스크롤·강조하던 신호라 하루 한 장이 되면서 가리킬 대상이 없어졌다
    if (searchParams.has('flip')) {
      return {
        ...base,
        return_reason: 'flip',
        scenario_id: toId(searchParams.get('flip')),
      };
    }
    // 데일리 리마인드 알림 탭 유입 — 셸 딥링크 url의 UTM에서 파생한다 (utm_* 자체는 앰플리튜드 어트리뷰션이 수집).
    // 웜 딥링크는 SPA 내부 이동이라 어트리뷰션이 못 보므로, 문구 슬러그도 이벤트 속성으로 실어야 유실이 없다
    if (searchParams.get('utm_campaign') === 'daily_reminder') {
      const copySlug = searchParams.get('utm_content');
      return {
        ...base,
        return_reason: 'reminder',
        ...(copySlug && { notification_copy: copySlug }),
      };
    }
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
        page_name: 'expression_list',
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

  // 미등록 경로 폴백 — 숫자 세그먼트를 :id로 치환해 page_name 카디널리티 폭발을 막는다
  const normalized = `/${seg.map((s) => (/^\d+$/.test(s) ? ':id' : s)).join('/')}`;
  return { page_name: normalized, path: pathname };
};
