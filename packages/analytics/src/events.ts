// 앰플리튜드 이벤트명·속성 계약 — 웹/모바일이 공유하는 단일 소스. 정책·전체 택소노미는 docs/analytics.md 참고
export const EVENTS = {
  // 공통
  PAGE_VIEWED: 'Page Viewed',

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

  // 대화
  CONVERSATION_STARTED: 'Conversation Started',
  RECORDING_STARTED: 'Recording Started',
  RECORDING_CANCELED: 'Recording Canceled',
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
  NPS_SURVEY_SUBMITTED: 'NPS Survey Submitted',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

// 속성 값 유니언 — 변형은 이벤트명이 아니라 속성으로 관리한다 (정책 2-1)
export type AuthProvider = 'kakao' | 'google' | 'apple';
export type LoginMethod = 'native' | 'web';
export type OnboardingStep = 'intro' | 'sound' | 'mic' | 'thought' | 'scenario';
export type ExpressionStep = 'quiz' | 'explain' | 'review';
export type TurnInputType = 'voice' | 'text';
export type HintSource = 'quiz' | 'review';
export type HomeReturnReason = 'just' | 'flip' | 'card';

// 이벤트별 속성 계약 — 키는 snake_case. 속성이 없는 이벤트는 undefined
export type EventProps = {
  'Page Viewed': {
    page_name: string;
    path: string;
    return_reason?: HomeReturnReason;
    scenario_id?: number;
    expression_id?: number;
  };

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
    source: 'card_back' | 'branch';
  };

  'Conversation Started': {
    scenario_id: number;
    session_id: number;
    first_speaker: string;
    is_retry: boolean;
  };
  // 세션은 백그라운드로 시작돼 확보 전에도 발화 준비가 가능하다 — session_id가 없을 수 있다
  'Recording Started': { session_id?: number; turn_index: number };
  'Recording Canceled': { session_id?: number; turn_index: number };
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
  'NPS Survey Submitted': { score: number; has_comment: boolean };
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
