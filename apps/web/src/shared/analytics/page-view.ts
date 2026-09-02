// 경로 → Page Viewed 속성 매핑 — 동적 세그먼트는 page_name으로 정규화하고 id는 속성으로 뺀다 (정책 2-2)
import type { EventProps, FeedbackType } from '@landit/analytics';

import { DAILY_REMINDER_CAMPAIGN } from './utm';

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
  'mailbox',
  'survey',
]);

// 피드백 작성은 유형별로 주소가 갈리지만 화면은 하나다 — 이름을 넷으로 쪼개지 않고 속성으로 싣는다.
// 키를 유형 쪽에 둔다. 유형이 늘 때 여기를 빠뜨리면 빌드가 깨진다 —
// 슬러그를 키로 두면 조용히 통과하고 새 유형의 페이지뷰만 속성 없이 쌓인다
const FEEDBACK_TYPE_SLUGS: Record<FeedbackType, string> = {
  BUG_REPORT: 'bug',
  FEATURE_REQUEST: 'feature',
  QUESTION: 'question',
  CHEER: 'cheer',
};

const readFeedbackType = (slug: string | undefined) =>
  (Object.keys(FEEDBACK_TYPE_SLUGS) as FeedbackType[]).find(
    (type) => FEEDBACK_TYPE_SLUGS[type] === slug,
  );

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
    // 날짜가 붙으면 완료한 지난 날 카드를 다시 보는 것 — 열 수 있는 과거는 완료한 날뿐이다
    const completedDate = searchParams.get('date');
    const base: PageViewProps = {
      page_name: 'scenario',
      path: pathname,
      ...(completedDate &&
        /^\d{4}-\d{2}-\d{2}$/.test(completedDate) && {
          completed_date: completedDate,
        }),
    };
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
    if (searchParams.get('utm_campaign') === DAILY_REMINDER_CAMPAIGN) {
      const copySlug = searchParams.get('utm_content');
      return {
        ...base,
        return_reason: 'reminder',
        ...(copySlug && { notification_copy: copySlug }),
      };
    }
    return base;
  }

  // 대화 화면은 /conversation 아래에 종류별로 있다 — 시나리오는 어느 카드인지 id가 붙는다
  if (seg[0] === 'conversation' && seg[1] === 'scenario' && seg[2]) {
    return {
      page_name: 'conversation_scenario',
      path: pathname,
      scenario_id: toId(seg[2]),
    };
  }

  // 스몰톡 대화는 가리킬 콘텐츠가 없어 id가 없다 — 상대·시작 방식은 Small Talk Started가 남긴다
  if (seg[0] === 'conversation' && seg[1] === 'smalltalk') {
    return { page_name: 'conversation_smalltalk', path: pathname };
  }

  // 지난 스몰톡 — 목록과 그 대화 한 건. 어느 대화인지는 세션 id로 남긴다
  if (seg[0] === 'smalltalk' && seg[1] === 'sessions') {
    if (!seg[2]) return { page_name: 'smalltalk_history', path: pathname };
    return {
      page_name:
        seg[3] === 'messages'
          ? 'smalltalk_history_transcript'
          : 'smalltalk_history_detail',
      path: pathname,
      session_id: toId(seg[2]),
    };
  }

  // 표현 학습은 둘째 칸에 출처를 달고 온다 (/expressions/{출처}/{출처id}/...).
  // 화면 이름은 출처와 무관하게 같고, 어디서 온 표현인지는 id 속성이 가른다
  if (
    seg[0] === 'expressions' &&
    (seg[1] === 'scenario' || seg[1] === 'session') &&
    seg[2] &&
    seg[3]
  ) {
    const source =
      seg[1] === 'scenario'
        ? { scenario_id: toId(seg[2]) }
        : { session_id: toId(seg[2]) };
    if (seg[3] === 'branch') {
      return { page_name: 'expression_list', path: pathname, ...source };
    }
    return {
      page_name: 'expression_learning',
      path: pathname,
      ...source,
      expression_id: toId(seg[3]),
    };
  }

  // 작성 화면은 어떤 유형을 고르고 들어왔는지가 주소에 남는다
  if (seg[0] === 'mailbox' && seg[1] === 'compose') {
    const feedbackType = readFeedbackType(seg[2]);
    return {
      page_name: 'feedback_compose',
      path: pathname,
      ...(feedbackType && { feedback_type: feedbackType }),
    };
  }

  // 편지함은 받은·보낸이 다른 리소스라 주소도 화면 이름도 갈린다 (/mailbox/{칸}/{id})
  if (seg[0] === 'mailbox' && seg[2]) {
    if (seg[1] === 'received') {
      return {
        page_name: 'mailbox_received',
        path: pathname,
        letter_id: toId(seg[2]),
      };
    }
    if (seg[1] === 'sent') {
      return {
        page_name: 'mailbox_sent',
        path: pathname,
        feedback_id: toId(seg[2]),
      };
    }
  }

  if (seg[0] === 'auth') return { page_name: 'auth_callback', path: pathname };

  if (seg.length === 1 && STATIC_PAGES.has(seg[0])) {
    return { page_name: seg[0], path: pathname };
  }

  // 미등록 경로 폴백 — 숫자 세그먼트를 :id로 치환해 page_name 카디널리티 폭발을 막는다
  const normalized = `/${seg.map((s) => (/^\d+$/.test(s) ? ':id' : s)).join('/')}`;
  return { page_name: normalized, path: pathname };
};
