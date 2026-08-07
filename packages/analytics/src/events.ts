// 앰플리튜드 이벤트명·속성 계약 — 웹/모바일이 공유하는 단일 소스. 정책·전체 택소노미는 docs/analytics.md 참고
export const EVENTS = {
  // 공통
  PAGE_VIEWED: 'Page Viewed',
  CONFIRM_SHEET_OPENED: 'Confirm Sheet Opened',
  CONFIRM_SHEET_DISMISSED: 'Confirm Sheet Dismissed',
  ERROR_RETRIED: 'Error Retried',
  APP_EXITED: 'App Exited',

  // 인증
  LOGIN_STARTED: 'Login Started',
  LOGIN_COMPLETED: 'Login Completed',
  LOGIN_FAILED: 'Login Failed',
  LOGIN_CANCELED: 'Login Canceled',
  LOGOUT_COMPLETED: 'Logout Completed',
  ACCOUNT_DELETED: 'Account Deleted',

  // 온보딩
  ONBOARDING_STARTED: 'Onboarding Started',
  ONBOARDING_STEP_VIEWED: 'Onboarding Step Viewed',
  ONBOARDING_STEP_COMPLETED: 'Onboarding Step Completed',
  MIC_PERMISSION_DECIDED: 'Mic Permission Decided',
  ONBOARDING_COMPLETED: 'Onboarding Completed',

  // 홈
  CATEGORY_SELECTED: 'Category Selected',
  SCENARIO_CARD_VIEWED: 'Scenario Card Viewed',
  SCENARIO_CARD_FLIPPED: 'Scenario Card Flipped',
  EXPRESSION_SELECTED: 'Expression Selected',

  // 오늘의 시나리오 — 대화 시작 전 갈리는 지점 3곳.
  // 자고 있는 카드의 시작 버튼을 직접 누르는지, 자동으로 뜬 "오늘의 대화를 시작할까요?"에 네/X로 답하는지
  CONVERSATION_START_TAPPED: 'Conversation Start Tapped',
  CONVERSATION_PROMPT_ACCEPTED: 'Conversation Prompt Accepted',
  CONVERSATION_PROMPT_DISMISSED: 'Conversation Prompt Dismissed',

  // 달력 스트립 — 완료한 지난 날을 되짚어 보는지, 월 뷰를 실제로 쓰는지
  CALENDAR_DATE_SELECTED: 'Calendar Date Selected',
  CALENDAR_VIEW_SWITCHED: 'Calendar View Switched',
  CALENDAR_PERIOD_MOVED: 'Calendar Period Moved',

  // 스트릭
  STREAK_OPENED: 'Streak Opened',
  STREAK_MONTH_CHANGED: 'Streak Month Changed',

  // 대화
  CONVERSATION_STARTED: 'Conversation Started',
  RECORDING_STARTED: 'Recording Started',
  RECORDING_STOPPED: 'Recording Stopped',
  RECORDING_CANCELED: 'Recording Canceled',
  MIC_SETTINGS_OPENED: 'Mic Settings Opened',
  INPUT_MODE_SWITCHED: 'Input Mode Switched',
  TURN_COMPLETED: 'Turn Completed',
  TURN_FAILED: 'Turn Failed',
  INNER_THOUGHT_VIEWED: 'Inner Thought Viewed',
  SPEECH_RECOGNITION_FAILED: 'Speech Recognition Failed',
  HINT_USED: 'Hint Used',
  CONVERSATION_COMPLETED: 'Conversation Completed',
  CONVERSATION_ABANDONED: 'Conversation Abandoned',

  // 분석 피드백
  FEEDBACK_VIEWED: 'Feedback Viewed',
  FEEDBACK_SKIPPED: 'Feedback Skipped',
  FEEDBACK_DETAIL_OPENED: 'Feedback Detail Opened',
  FEEDBACK_TURN_VIEWED: 'Feedback Turn Viewed',
  FEEDBACK_COMPLETED: 'Feedback Completed',

  // 표현 학습
  EXPRESSION_LIST_VIEWED: 'Expression List Viewed',
  EXPRESSION_LEARNING_SKIPPED: 'Expression Learning Skipped',
  EXPRESSION_LEARNING_STARTED: 'Expression Learning Started',
  EXPRESSION_STEP_VIEWED: 'Expression Step Viewed',
  QUIZ_WORD_PICKED: 'Quiz Word Picked',
  QUIZ_WORD_REMOVED: 'Quiz Word Removed',
  QUIZ_ANSWER_SUBMITTED: 'Quiz Answer Submitted',
  EXAMPLE_SENTENCE_VIEWED: 'Example Sentence Viewed',
  REVIEW_ANSWER_SUBMITTED: 'Review Answer Submitted',
  EXPRESSION_COMPLETED: 'Expression Completed',
  EXPRESSION_ABANDONED: 'Expression Abandoned',

  // NPS
  NPS_SURVEY_OPENED: 'NPS Survey Opened',
  NPS_SCORE_SELECTED: 'NPS Score Selected',
  NPS_SURVEY_SUBMITTED: 'NPS Survey Submitted',
  NPS_SURVEY_DISMISSED: 'NPS Survey Dismissed',

  // 알림 동의
  NOTIFICATION_CONSENT_VIEWED: 'Notification Consent Viewed',
  NOTIFICATION_CONSENT_ACCEPTED: 'Notification Consent Accepted',
  NOTIFICATION_CONSENT_DISMISSED: 'Notification Consent Dismissed',

  // 유입 — /download 스토어 리다이렉트가 서버에서 발화한다 (route 핸들러, LAN-237)
  DOWNLOAD_LINK_VISITED: 'Download Link Visited',

  // 앱 업데이트 유도 UI에서 스토어 앱을 직접 연다
  APP_UPDATE_STORE_OPENED: 'App Update Store Opened',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

// 속성 값 유니언 — 변형은 이벤트명이 아니라 속성으로 관리한다 (정책 2-1)
export type AuthProvider = 'kakao' | 'google' | 'apple';
export type LoginMethod = 'native' | 'web';
export type OnboardingStep =
  'intro' | 'sound' | 'mic' | 'thought' | 'notification' | 'scenario';
export type ExpressionStep = 'quiz' | 'explain' | 'review';
export type TurnInputType = 'voice' | 'text';
export type HintSource = 'quiz' | 'review';
export type HomeReturnReason = 'just' | 'flip' | 'card' | 'reminder';
export type ConfirmSheetKind =
  'conversation_exit' | 'expression_exit' | 'account_delete';
export type RetryScreen =
  'scenario' | 'conversation' | 'card_back' | 'expression_list' | 'streak';
// 알림 동의를 청한 지면 — 온보딩 스텝은 기존 온보딩 계측이 커버해서 없다.
// 키는 source — surface는 baseProps의 전역 속성(app·browser)이라 겹치면 덮어쓴다
export type NotificationConsentSource = 'scenario' | 'me';
export type CalendarView = 'week' | 'month';

// 이벤트별 속성 계약 — 키는 snake_case. 속성이 없는 이벤트는 undefined
export type EventProps = {
  'Page Viewed': {
    page_name: string;
    path: string;
    return_reason?: HomeReturnReason;
    scenario_id?: number;
    expression_id?: number;
    // 알림 유입(reminder)일 때만 — 탭한 알림의 문구 슬러그 (utm_content에서 파생, 어휘는 reminder-copies.ts)
    notification_copy?: string;
    // 시나리오 화면에서 완료한 지난 날 카드를 볼 때만 — 열 수 있는 과거는 완료한 날뿐이다 (yyyy-MM-dd)
    completed_date?: string;
  };
  // 파괴적 행동(이탈·탈퇴) 전 확인 시트 — 열림/취소로 고민율을 본다. 확정은 각 Abandoned/Deleted 이벤트
  'Confirm Sheet Opened': { sheet: ConfirmSheetKind };
  'Confirm Sheet Dismissed': { sheet: ConfirmSheetKind };
  'Error Retried': { screen: RetryScreen };
  // 네이티브 뒤로가기로 앱 종료 (셸에서만)
  'App Exited': { trigger: 'back_button' };

  'Login Started': { provider: AuthProvider; method: LoginMethod };
  'Login Completed': {
    provider: AuthProvider;
    method: LoginMethod;
    is_new_user: boolean;
  };
  // 네이티브 셸의 에러/취소 메시지에는 provider가 없어 optional이다
  'Login Failed': {
    provider?: AuthProvider;
    method: LoginMethod;
    reason?: string;
  };
  'Login Canceled': { provider?: AuthProvider };
  'Logout Completed': undefined;
  'Account Deleted': undefined;

  'Onboarding Started': undefined;
  'Onboarding Step Viewed': { step: OnboardingStep; step_index: number };
  'Onboarding Step Completed': { step: OnboardingStep };
  'Mic Permission Decided': {
    granted: boolean;
    source: 'onboarding' | 'conversation';
  };
  'Onboarding Completed': undefined;

  'Category Selected': {
    category_id: number;
    category_name: string;
    is_locked: boolean;
  };
  'Scenario Card Viewed': {
    card_type: 'scenario' | 'completion';
    position: number;
    scenario_id?: number;
    difficulty?: string;
    is_completed?: boolean;
    is_locked?: boolean;
  };
  'Scenario Card Flipped': {
    scenario_id: number;
    direction: 'back' | 'front';
    trigger: 'button' | 'auto';
  };
  'Expression Selected': {
    expression_id: number;
    scenario_id: number;
    // post_conversation = 대화 직후 표현 리스트 화면, card_back = 홈 카드 뒷면
    source: 'card_back' | 'post_conversation';
  };

  // retry = 전날 못 끝낸 대화를 이어서 하는 카드였는지 (오늘 새로 받은 시나리오면 false)
  'Conversation Start Tapped': { retry: boolean };
  'Conversation Prompt Accepted': { retry: boolean };
  'Conversation Prompt Dismissed': { retry: boolean };

  'Calendar Date Selected': { is_today: boolean };
  'Calendar View Switched': { view: CalendarView };
  'Calendar Period Moved': { direction: 'prev' | 'next'; view: CalendarView };

  // 헤더 열매로 연속 기록 페이지 진입 — 얼마나 눌리는지, 어떤 상태에서 눌리는지 본다
  'Streak Opened': {
    source: 'home_header';
    streak_days: number;
    is_active_today: boolean;
  };
  'Streak Month Changed': {
    direction: 'prev' | 'next';
    year: number;
    month: number;
  };

  'Conversation Started': {
    scenario_id: number;
    session_id: number;
    first_speaker: string;
    is_retry: boolean;
  };
  // 세션은 백그라운드로 시작돼 확보 전에도 발화 준비가 가능하다 — session_id가 없을 수 있다
  'Recording Started': { session_id?: number; turn_index: number };
  // ■(답변 완료) 탭 순간 — 이후 인식·제출 결과는 Turn Completed/Failed로 이어진다
  'Recording Stopped': { session_id?: number; turn_index: number };
  'Recording Canceled': { session_id?: number; turn_index: number };
  'Mic Settings Opened': undefined;
  'Input Mode Switched': { session_id?: number; mode: TurnInputType };
  'Turn Completed': {
    session_id: number;
    scenario_id: number;
    turn_index: number;
    input_type: TurnInputType;
    char_count: number;
  };
  'Turn Failed': {
    session_id?: number;
    turn_index: number;
    reason: 'empty' | 'api_error';
  };
  'Inner Thought Viewed': {
    session_id: number;
    turn_index: number;
    thought_type?: string;
  };
  'Speech Recognition Failed': {
    engine?: 'deepgram' | 'web_speech';
    reason?: string;
  };
  'Hint Used': { source: HintSource; level: number };
  'Conversation Completed': {
    session_id: number;
    scenario_id: number;
    turn_count: number;
  };
  'Conversation Abandoned': {
    session_id?: number;
    scenario_id: number;
    turn_index: number;
  };

  // 피드백 응답에는 scenario_id가 없다 — session_id로 서버에서 조인한다
  'Feedback Viewed': {
    session_id: number;
    good_count: number;
    turn_count: number;
    native_score?: number;
    star_rating?: number;
  };
  // 총평만 보고 상세 없이 나감 — Feedback Completed와 상호 배타
  'Feedback Skipped': { session_id: number };
  'Feedback Detail Opened': { session_id: number };
  'Feedback Turn Viewed': {
    session_id: number;
    turn_index: number;
    feedback_type: string;
  };
  'Feedback Completed': { session_id: number };

  'Expression List Viewed': { scenario_id: number; expression_count: number };
  // 분기에서 표현을 배우지 않고 "다음 대화"로 넘어간 경우 — 학습 퍼널 이탈 지점
  'Expression Learning Skipped': {
    scenario_id: number;
    expression_count: number;
  };
  'Expression Learning Started': { expression_id: number; scenario_id: number };
  'Expression Step Viewed': { expression_id: number; step: ExpressionStep };
  'Quiz Word Picked': { expression_id: number; picked_count: number };
  'Quiz Word Removed': { expression_id: number; picked_count: number };
  'Quiz Answer Submitted': {
    expression_id: number;
    is_correct: boolean;
    hint_level: number;
  };
  'Example Sentence Viewed': { expression_id: number; sentence_index: number };
  'Review Answer Submitted': {
    expression_id: number;
    is_correct: boolean;
    wrong_count: number;
    hint_level: number;
  };
  'Expression Completed': { expression_id: number; scenario_id: number };
  'Expression Abandoned': { expression_id: number; step: ExpressionStep };

  'NPS Survey Opened': { source: 'home_header' | 'all_completed' | 'me' };
  'NPS Score Selected': { score: number };
  'NPS Survey Submitted': { score: number; has_comment: boolean };
  // ✕로 제출 없이 닫음 — 점수를 골라놓고 닫았으면 score가 담긴다
  'NPS Survey Dismissed': { score?: number };

  'Notification Consent Viewed': { source: NotificationConsentSource };
  // 수락 = OS 권한창 요청까지 이어짐. 실제 허용/거부는 OS 팝업 결과라 별도 (권한 상태로 세그먼트)
  'Notification Consent Accepted': { source: NotificationConsentSource };
  'Notification Consent Dismissed': { source: NotificationConsentSource };

  // 서버 발화라 세션·리플레이·공통 속성 없음. device_id 랜덤 — 방문 횟수 집계용.
  // /download 링크 자체를 방문한 경우만 (외부 링크·인스타 등)
  'Download Link Visited': { store: 'play_store' | 'app_store' };

  // /download를 거치지 않고 스토어 앱을 바로 연 경우만 (앱 업데이트 유도 UI)
  'App Update Store Opened': { store: 'play_store' | 'app_store' };
};

// 컴파일 타임 검증 ① EventProps가 모든 이벤트를 빠짐없이 커버한다
type AssertExhaustive<T extends Record<EventName, unknown>> = T;
type _EventPropsCoversAllEvents = AssertExhaustive<EventProps>;

// 컴파일 타임 검증 ② 속성 키는 snake_case(소문자·숫자·언더스코어)여야 한다
type NonSnakeCaseKeys<T> = {
  [E in keyof T]: {
    [K in keyof T[E] & string]: K extends Lowercase<K> ? never : K;
  }[keyof T[E] & string];
}[keyof T];
type AssertNever<T extends never> = T;
type _PropKeysAreSnakeCase = AssertNever<NonSnakeCaseKeys<EventProps>>;
