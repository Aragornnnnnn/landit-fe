// [시뮬] 피드백 대본 — 세션 API 연동 전까지 화면 형태 확인용 고정 데이터
import type { SessionFeedbackResponse } from '../api/session-feedback';

export const FEEDBACK_FIXTURE: SessionFeedbackResponse = {
  sessionId: 1,
  nativeScore: 87,
  starRating: 2.5,
  highlightMessage: '한국인의 23%가 놓치는 복수+s를 챙긴 사람.',
  summaryMessage: '거의 원어민처럼 착지했어요',
  messageFeedbacks: [
    {
      messageFeedbackId: 1,
      messageId: 11,
      turnNumber: 1,
      userMessage: 'Can I get an iced americano, please?',
      evaluationContext: {
        type: 'AI_MESSAGE',
        content: 'Hi! Welcome to Landit Coffee. What can I get for you today?',
        translatedContent: '어서 오세요! 오늘은 뭘 드릴까요?',
      },
      feedbackType: 'GOOD',
      baseLocaleAnalogy: '"아이스 아메리카노 한 잔 주세요" 만큼 깔끔했어요.',
      positiveFeedback: null,
      feedbackDetail: 'please를 붙여 정중하면서도 군더더기 없이 주문했어요.',
      correctionExpression: null,
      correctionReason: null,
      benchmarkMessage:
        'get을 써서 원어민이 카페에서 쓰는 자연스러운 주문이 됐어요.',
    },
    {
      messageFeedbackId: 2,
      messageId: 12,
      turnNumber: 2,
      userMessage: 'I want size big.',
      evaluationContext: {
        type: 'AI_MESSAGE',
        content: 'Sure! What size would you like?',
        translatedContent: '좋아요! 사이즈는 어떻게 드릴까요?',
      },
      feedbackType: 'NEEDS_IMPROVEMENT',
      baseLocaleAnalogy: '"큰 사이즈요"를 "사이즈 큰"처럼 말한 느낌이에요.',
      positiveFeedback: '사이즈를 고르려는 의도는 분명히 전달됐어요.',
      feedbackDetail: null,
      correctionExpression: 'Can I get a large, please?',
      correctionReason:
        '카페에서는 big 대신 large를 쓰고, size는 빼는 게 자연스러워요.',
      benchmarkMessage: null,
    },
    {
      messageFeedbackId: 3,
      messageId: 13,
      turnNumber: 3,
      userMessage: "It's for here.",
      evaluationContext: {
        type: 'SCENARIO_OPENING_INSTRUCTION',
        content: 'Tell the barista whether you want it for here or to go.',
        translatedContent: '매장에서 마실지 포장할지 점원에게 말해보세요.',
      },
      feedbackType: 'GOOD',
      baseLocaleAnalogy: '"여기서 먹을게요"처럼 자연스러웠어요.',
      positiveFeedback: null,
      feedbackDetail:
        'for here라는 표현을 정확히 골라 상황에 딱 맞게 말했어요.',
      correctionExpression: null,
      correctionReason: null,
      benchmarkMessage:
        'to go와 짝이 되는 for here를 알고 써서 원어민처럼 들렸어요.',
    },
  ],
};
