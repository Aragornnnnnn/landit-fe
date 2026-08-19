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

  // 시나리오 대화 — 이름을 스몰톡과 짝 맞춰 둔다 (폴더명도 conversation/scenario)
  SCENARIO_TALK_STARTED: 'Scenario Talk Started',
  RECORDING_STARTED: 'Recording Started',
  RECORDING_STOPPED: 'Recording Stopped',
  RECORDING_CANCELED: 'Recording Canceled',
  MIC_SETTINGS_OPENED: 'Mic Settings Opened',
  INPUT_MODE_SWITCHED: 'Input Mode Switched',
  SCENARIO_TALK_TURN_COMPLETED: 'Scenario Talk Turn Completed',
  TURN_FAILED: 'Turn Failed',
  INNER_THOUGHT_VIEWED: 'Inner Thought Viewed',
  SPEECH_RECOGNITION_FAILED: 'Speech Recognition Failed',
  HINT_USED: 'Hint Used',
  SCENARIO_TALK_COMPLETED: 'Scenario Talk Completed',
  SCENARIO_TALK_ABANDONED: 'Scenario Talk Abandoned',

  // 스몰톡 — 시나리오와 탭도 목적도 달라 이벤트를 따로 둔다.
  // 마이크·STT처럼 대화 엔진이 쏘는 것(Recording·Turn Failed·Inner Thought Viewed)은 두 대화가 함께 쓴다
  SMALL_TALK_STARTED: 'Small Talk Started',
  SMALL_TALK_TURN_COMPLETED: 'Small Talk Turn Completed',
  SMALL_TALK_COMPLETED: 'Small Talk Completed',
  SMALL_TALK_ABANDONED: 'Small Talk Abandoned',

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

  // 편지함
  MAILBOX_TAB_SWITCHED: 'Mailbox Tab Switched',
  FEEDBACK_TYPE_SELECTED: 'Feedback Type Selected',
  FEEDBACK_SUBMITTED: 'Feedback Submitted',

  // 알림 동의
  NOTIFICATION_CONSENT_VIEWED: 'Notification Consent Viewed',
  NOTIFICATION_CONSENT_ACCEPTED: 'Notification Consent Accepted',
  NOTIFICATION_CONSENT_DISMISSED: 'Notification Consent Dismissed',

  // 소감 시트 — 첫 시나리오 대화·첫 스몰톡·다른 날 두 번째 대화(랜딧 소감)를 마치고 홈에 돌아왔을 때 한 번 묻는다
  SATISFACTION_PROMPT_VIEWED: 'Satisfaction Prompt Viewed',
  SATISFACTION_PROMPT_ANSWERED: 'Satisfaction Prompt Answered',
  // 랜딧 소감에서 좋았어요 → 별점판 → 스토어 리뷰 화면을 연다
  REVIEW_STORE_OPENED: 'Review Store Opened',

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
// 스몰톡 대화 상대 — 홈에서 고른 캐릭터. 시나리오엔 없는 축이라 스몰톡 이벤트에만 붙는다
export type TalkPartner = 'chloe' | 'marco' | 'teddy';
export type HintSource = 'quiz' | 'review';
export type HomeReturnReason = 'just' | 'flip' | 'card' | 'reminder';
export type ConfirmSheetKind =
  'conversation_exit' | 'expression_exit' | 'account_delete';
export type RetryScreen =
  | 'scenario'
  | 'smalltalk'
  | 'conversation'
  | 'card_back'
  | 'expression_list'
  | 'streak'
  | 'mailbox';
// 피드백 유형 — 작성 화면에서 고르는 넷. 값은 서버 enum 그대로다 (지표와 데이터가 같은 말을 쓰도록)
export type FeedbackType =
  'BUG_REPORT' | 'FEATURE_REQUEST' | 'QUESTION' | 'CHEER';
// 알림 동의를 청한 지면 — 온보딩 스텝은 기존 온보딩 계측이 커버해서 없다.
// 키는 source — surface는 baseProps의 전역 속성(app·browser)이라 겹치면 덮어쓴다
export type NotificationConsentSource = 'scenario' | 'me';
// 소감을 물은 순간과 답 — 닫기(딤·뒤로가기)도 답으로 셈해 다시 묻지 않는다.
// talk = 대화 종류(첫 소감), app = 다른 날 두 번째 대화 뒤 랜딧 전체를 묻는 소감(별점 유도)
export type SatisfactionTalk = 'scenario' | 'smalltalk';
export type SatisfactionMoment = SatisfactionTalk | 'app';
export type SatisfactionAnswer = 'good' | 'bad' | 'dismiss';
export type CalendarView = 'week' | 'month';

// 표현이 어디서 왔는가 — 시나리오 콘텐츠에 붙어 있던 표현인지, 그 스몰톡에서 만들어진 표현인지.
// 표현 학습 화면은 둘이 같이 쓰므로 이벤트도 하나로 두고 출처만 갈아 끼운다 (둘 중 하나만 실린다)
type ExpressionSource = { scenario_id: number } | { session_id: number };

// 이벤트별 속성 계약 — 키는 snake_case. 속성이 없는 이벤트는 undefined
export type EventProps = {
  'Page Viewed': {
    page_name: string;
    path: string;
    return_reason?: HomeReturnReason;
    scenario_id?: number;
    // 스몰톡에서 갈라져 나온 화면들만 — 지난 스몰톡 기록과 거기서 만든 표현
    session_id?: number;
    expression_id?: number;
    // 알림 유입(reminder)일 때만 — 탭한 알림의 문구 슬러그 (utm_content에서 파생, 어휘는 reminder-copies.ts)
    notification_copy?: string;
    // 시나리오 화면에서 완료한 지난 날 카드를 볼 때만 — 열 수 있는 과거는 완료한 날뿐이다 (yyyy-MM-dd)
    completed_date?: string;
    // 편지 상세일 때만
    letter_id?: number;
    // 보낸 피드백 상세에서만 — 받은 편지와 아이디 공간이 다르다
    feedback_id?: number;
    // 피드백 작성일 때만 — 유형별로 주소가 갈려도 화면 이름은 하나로 둔다
    feedback_type?: FeedbackType;
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
  'Expression Selected': ExpressionSource & {
    expression_id: number;
    // post_conversation = 대화 직후 표현 리스트, card_back = 홈 카드 뒷면, history = 지난 스몰톡 기록
    source: 'card_back' | 'post_conversation' | 'history';
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
  // 편지함에서 받은/보낸 칸을 옮긴다 — 보낸 편지를 실제로 되짚어 보는지 본다
  'Mailbox Tab Switched': { box: 'received' | 'sent' };
  // 유형 선택 화면에서 하나를 고른다 — 무슨 말을 하고 싶어 들어오는지의 분포
  'Feedback Type Selected': { feedback_type: FeedbackType };
  // 실제로 보냈다. 원문은 PII 위험이 있어 길이만 남긴다
  'Feedback Submitted': { feedback_type: FeedbackType; length: number };
  'Streak Month Changed': {
    direction: 'prev' | 'next';
    year: number;
    month: number;
  };

  'Scenario Talk Started': {
    scenario_id: number;
    session_id: number;
    first_speaker: string;
    is_retry: boolean;
  };
  // 세션은 백그라운드로 시작돼 확보 전에도 발화 준비가 가능하다 — session_id가 없을 수 있다
  'Recording Started': { session_id?: number; turn_index: number };
  // ■(답변 완료) 탭 순간 — 이후 인식·제출 결과는 각 대화의 Turn Completed / Turn Failed로 이어진다
  'Recording Stopped': { session_id?: number; turn_index: number };
  'Recording Canceled': { session_id?: number; turn_index: number };
  'Mic Settings Opened': undefined;
  'Input Mode Switched': { session_id?: number; mode: TurnInputType };
  'Scenario Talk Turn Completed': {
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
  'Scenario Talk Completed': {
    session_id: number;
    scenario_id: number;
    turn_count: number;
  };
  'Scenario Talk Abandoned': {
    session_id?: number;
    scenario_id: number;
    turn_index: number;
  };

  // 스몰톡 — 상대(partner)는 시나리오에 없는 축이라 전 이벤트에 싣는다. 누구와 얘기하는지로 다 갈린다
  'Small Talk Started': {
    session_id: number;
    partner: TalkPartner;
    // 주제를 고르면 상대가 먼저(AI), 직접 걸면 내가 먼저(USER)
    first_speaker: string;
    // 상대가 먼저 걸 때만 — 고른 주제
    topic_id?: number;
  };
  'Small Talk Turn Completed': {
    session_id: number;
    partner: TalkPartner;
    turn_index: number;
    input_type: TurnInputType;
    char_count: number;
    // 이 발화로 깎인 오늘의 말하기 예산
    utterance_duration_ms: number;
  };
  'Small Talk Completed': {
    session_id: number;
    partner: TalkPartner;
    turn_count: number;
    // 이 대화에서 말한 시간과, 시간을 다 써서 끝났는지
    speaking_duration_ms: number;
    end_reason: 'user_ended' | 'time_limit';
  };
  'Small Talk Abandoned': {
    session_id: number;
    partner: TalkPartner;
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

  // 표현 학습은 시나리오 대화와 스몰톡이 같은 화면·같은 API를 쓴다 — 이벤트도 하나로 두고
  // 어디서 온 표현인지만 출처로 싣는다 (둘 중 하나만 온다)
  'Expression List Viewed': ExpressionSource & { expression_count: number };
  // 분기 화면을 X로 닫고 학습 없이 나감 — 학습 퍼널 이탈 지점.
  // 연출 중에 닫으면 리스트를 아직 못 받았을 수 있어 expression_count가 0일 수 있다
  'Expression Learning Skipped': ExpressionSource & {
    expression_count: number;
  };
  'Expression Learning Started': ExpressionSource & { expression_id: number };
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
  'Expression Completed': ExpressionSource & { expression_id: number };
  'Expression Abandoned': { expression_id: number; step: ExpressionStep };

  'Notification Consent Viewed': { source: NotificationConsentSource };
  // 수락 = OS 권한창 요청까지 이어짐. 실제 허용/거부는 OS 팝업 결과라 별도 (권한 상태로 세그먼트)
  'Notification Consent Accepted': { source: NotificationConsentSource };
  'Notification Consent Dismissed': { source: NotificationConsentSource };

  'Satisfaction Prompt Viewed': { moment: SatisfactionMoment };
  'Satisfaction Prompt Answered': {
    moment: SatisfactionMoment;
    answer: SatisfactionAnswer;
  };
  'Review Store Opened': { store: 'play_store' | 'app_store' };

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
