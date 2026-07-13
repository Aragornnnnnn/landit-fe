// 표현학습 API mock 핸들러 — 백엔드 미구현/500 동안 개발용. BE 붙으면 mock을 끄면 된다(NEXT_PUBLIC_API_MOCKING).
import { http, HttpResponse } from 'msw';

import type { ExpressionLearning } from '@/features/expression/api/learning';
import type { Expression } from '@/features/expression/api/list';
import type { ExpressionPractice } from '@/features/expression/api/practice';
import type { ScenarioListResponse } from '@/features/scenario/api/list';

// 백엔드 공통 응답 봉투 { success, data, error }로 감싼다 (parseApiResponse가 이 형태를 깐다)
const ok = <T>(data: T) =>
  HttpResponse.json({ success: true, data, error: null });

const EXPRESSIONS: Expression[] = [
  {
    expressionId: 1,
    displayOrder: 1,
    targetExpressionText: "It's the best ever",
    baseExpressionMeaningText: '완전 역대급이다!',
    completed: true,
    locked: false,
  },
  {
    expressionId: 2,
    displayOrder: 2,
    targetExpressionText: "That's so me",
    baseExpressionMeaningText: '완전 나잖아?',
    completed: true,
    locked: false,
  },
  {
    expressionId: 3,
    displayOrder: 3,
    targetExpressionText: 'get a good deal',
    baseExpressionMeaningText: '싸게 샀어!',
    completed: false,
    locked: false,
  },
  {
    expressionId: 4,
    displayOrder: 4,
    targetExpressionText: '',
    baseExpressionMeaningText: '김칫국 마시지 마',
    completed: false,
    locked: true,
  },
  {
    expressionId: 5,
    displayOrder: 5,
    targetExpressionText: '',
    baseExpressionMeaningText: '눈치 챙겨',
    completed: false,
    locked: true,
  },
  {
    expressionId: 6,
    displayOrder: 6,
    targetExpressionText: '',
    baseExpressionMeaningText: '밑져야 본전이지',
    completed: false,
    locked: true,
  },
];

const LEARNING: ExpressionLearning = {
  expressionId: 3,
  targetExpressionText: 'get a good deal',
  baseExpressionMeaningText: '싸게 샀어!',
  usageDescription: '좋은 조건에 사다 · 싸게 잘 사다',
  representativeQuestionText: 'How much were those shoes?',
  representativeQuestionTranslation: '그 신발 얼마였어?',
  representativeSentenceText: 'I got a good deal on these shoes yesterday.',
  representativeSentenceTranslation: '어제 진짜 싸게 샀어!',
  highlightingPart: 'got a good deal',
  representativeImageUrl: null,
};

const PRACTICE: ExpressionPractice = {
  targetExpressionText: 'get a good deal',
  baseExpressionMeaningText: '싸게 샀어!',
  usageDescription:
    'deal은 거래라는 뜻이에요. 좋은 거래를 얻었다 = 싸게 잘 샀다는 뜻으로, 가격보다 이득을 봤다는 느낌을 줘요.',
  practiceSentence: [
    {
      sentenceText: 'You got a good deal!',
      highlightingPart: 'good deal',
      sentenceTranslation: '너 완전 싸게 샀네!',
      practiceQuestion: 'Look at my new bag!',
      practiceQuestionTranslation: '내 새 가방 봐봐!',
      imageUrl: null,
    },
    {
      sentenceText: 'Is this a good deal?',
      highlightingPart: 'good deal',
      sentenceTranslation: '이거 사면 이득이야?',
      practiceQuestion: "It's 30% off today.",
      practiceQuestionTranslation: '오늘 30% 할인이래.',
      imageUrl: null,
    },
  ],
  writingSentence: {
    writingSentenceText: 'I got a good deal on this jacket',
    writingSentenceTranslation: '나 이 재킷 진짜 싸게 샀어.',
    writingQuestion: 'How much was that?',
    writingQuestionTranslation: '그거 얼마에 샀어?',
    // 정답 순서 + 허위매물(price·buy·cheap) 섞인 뱅크 — BE가 이 두 리스트를 준다고 가정
    answerWords: ['I', 'got', 'a', 'good', 'deal', 'on', 'this', 'jacket'],
    shuffledWords: [
      'on',
      'price',
      'I',
      'jacket',
      'buy',
      'good',
      'a',
      'this',
      'got',
      'cheap',
      'deal',
    ],
  },
};

// dev 로그인 우회로 실서버 토큰이 없을 때도 홈이 뜨도록 시나리오도 mock한다 (완료 1개 → 표현학습 CTA 노출)
const SCENARIOS: ScenarioListResponse = {
  categories: [
    {
      categoryId: 1,
      categoryName: '기숙사',
      displayOrder: 1,
      categoryLocked: false,
      categoryLockReason: null,
      scenarios: [
        {
          scenarioId: 1,
          starRating: 3,
          displayOrder: 1,
          scenarioTitle: '입주 첫날, 룸메이트 Charlie와 첫 만남',
          briefing:
            '기숙사 입주 첫날, 방문을 열자 이미 짐을 풀고 있던 룸메이트 Charlie가 반갑게 인사를 건넨다.',
          conversationGoal: '자기소개하고 친해지기',
          difficulty: 'EASY',
          firstSpeaker: 'AI',
          thumbnailUrl: null,
          completed: true,
          locked: false,
          lockReason: null,
          openingPreview: null,
        },
        {
          scenarioId: 2,
          starRating: null,
          displayOrder: 2,
          scenarioTitle: '공용 주방에서 요리하다 마주친 이웃',
          briefing:
            '늦은 밤 공용 주방에서 라면을 끓이다 옆 방 이웃과 마주친다.',
          conversationGoal: '가벼운 잡담 나누기',
          difficulty: 'NORMAL',
          firstSpeaker: 'USER',
          thumbnailUrl: null,
          completed: false,
          locked: false,
          lockReason: null,
          openingPreview: null,
        },
      ],
    },
  ],
};

export const handlers = [
  http.get('/api/v1/scenarios', () => ok(SCENARIOS)),
  http.get('/api/v1/expressions/:scenarioId', () => ok(EXPRESSIONS)),
  http.get('/api/v1/expressions/:expressionId/learning-start', ({ params }) =>
    ok({ ...LEARNING, expressionId: Number(params.expressionId) }),
  ),
  http.get('/api/v1/expressions/:expressionId/practice', () => ok(PRACTICE)),
  http.post('/api/v1/expressions/:expressionId/learning-finish', () => ok({})),
];
