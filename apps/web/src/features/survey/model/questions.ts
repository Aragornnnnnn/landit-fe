// 설문 문항 — 화면은 이 배열만 따라 그린다. 문항을 바꿀 땐 여기만 고친다.
// 순서는 통과율 기준 — 가벼운 것부터, 가격은 뒤에, 쓰는 문항은 선택으로 맨 끝
interface QuestionBase {
  id: string;
  title: string;
  // 제목 아래 한 줄 보조 문구
  hint?: string;
  // 앞 문항의 답이 조건에 맞을 때만 보여준다 — 고른 값이 같거나(유학 준비 → 준비 방법), 점수가 이상이거나(추천 의향 3점↑ → 소개 여부)
  showIf?:
    | { questionId: string; equals: string }
    | { questionId: string; atLeast: number };
}

export type SingleQuestion = QuestionBase & {
  kind: 'single';
  options: readonly string[];
  // "기타 (직접 입력)" 선택지를 끝에 붙인다
  other?: boolean;
};
export type MultiQuestion = QuestionBase & {
  kind: 'multi';
  options: readonly string[];
  other?: boolean;
};
// 1~5점. 양 끝에 뜻을 단다
export type ScaleQuestion = QuestionBase & {
  kind: 'scale';
  low: string;
  high: string;
};
export type TextQuestion = QuestionBase & {
  kind: 'text';
  placeholder: string;
};
export type Question =
  SingleQuestion | MultiQuestion | ScaleQuestion | TextQuestion;

// 기타 선택지의 저장값. 화면 라벨은 OTHER_LABEL, 직접 쓴 내용은 `${id}_other` 키에 따로 싣는다
export const OTHER_OPTION = '기타';
export const OTHER_LABEL = '기타 (직접 입력)';
export const otherKey = (id: string) => `${id}_other`;

// 화면에 놓을 선택지 — 기타를 쓰는 문항은 끝에 붙는다
export const choiceOptions = (question: SingleQuestion | MultiQuestion) =>
  question.other ? [...question.options, OTHER_OPTION] : question.options;
export const optionLabel = (option: string) =>
  option === OTHER_OPTION ? OTHER_LABEL : option;

// 이용권이 들어가는 날 — 완료 화면이 알려 준다
export const REWARD_DATE = '9월 7일';

export const QUESTIONS: readonly Question[] = [
  {
    id: 'channel',
    kind: 'single',
    title: '랜딧을 어떻게\n알게 되셨나요?',
    // 광고와 랜딧 계정은 둘 다 인스타그램이라 붙여 두면 헷갈려 사이를 띄운다
    options: [
      '앱스토어 · 플레이스토어 검색',
      '인스타그램 광고',
      '지인 추천',
      '랜딧 인스타그램 계정',
    ],
    other: true,
  },
  {
    id: 'study_purpose',
    kind: 'single',
    title: '영어 공부는\n어떤 목적으로 하세요?',
    options: [
      '유학 준비',
      '교환학생 준비',
      '취업 · 이직 준비',
      '여행',
      '자기계발 · 취미',
    ],
    other: true,
  },
  {
    id: 'study_abroad_prep',
    kind: 'multi',
    title: '유학 준비는\n어떻게 하고 계세요?',
    showIf: { questionId: 'study_purpose', equals: '유학 준비' },
    options: [
      '어학원 · 과외',
      '시험 대비 (토플, 아이엘츠 등)',
      '앱 · 온라인 강의로 독학',
      '유학원 이용',
    ],
    other: true,
  },
  {
    id: 'features',
    kind: 'multi',
    title: '랜딧에서 주로\n어떤 기능을 쓰세요?',
    options: ['시나리오 대화', '표현 학습', '스몰톡'],
    other: true,
  },
  {
    id: 'usage_time',
    kind: 'single',
    title: '주로 언제\n랜딧을 쓰세요?',
    options: [
      '출퇴근 · 등하교 시간',
      '점심시간 같은 자투리 시간',
      '저녁부터 밤, 하루 마무리 시간',
      '주말',
      '정해진 시간 없이 틈틈이',
    ],
  },
  {
    id: 'satisfaction',
    kind: 'scale',
    title: '랜딧, 전반적으로\n어떠셨나요?',
    low: '아쉬웠어요',
    high: '아주 만족했어요',
  },
  {
    id: 'satisfaction_reason',
    kind: 'text',
    title: '그렇게 느끼신 이유를\n알려주세요',
    hint: '좋았던 점, 아쉬웠던 점 모두 환영이에요',
    placeholder: '편하게 적어주세요',
  },
  {
    id: 'monthly_price_limit',
    kind: 'single',
    title: '랜딧은 월 얼마부터\n적정하다고 느끼세요?',
    options: ['5,000원', '8,000원', '10,000원', '15,000원', '15,000원 이상'],
  },
  {
    id: 'recommend_intent',
    kind: 'scale',
    title: '랜딧을 주변에\n추천할 마음이 있으세요?',
    low: '전혀 없어요',
    high: '아주 많아요',
  },
  {
    id: 'has_recommended',
    kind: 'single',
    title: '실제로 주변에\n소개한 적이 있으세요?',
    showIf: { questionId: 'recommend_intent', atLeast: 3 },
    options: ['있어요', '없어요'],
  },
  {
    id: 'wish',
    kind: 'text',
    title: '마지막으로 랜딧에\n바라는 점을 남겨주세요',
    hint: '있었으면 하는 기능, 불편했던 점 무엇이든 좋아요',
    placeholder: '편하게 적어주세요',
  },
];
