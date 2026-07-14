// [시뮬] 대화 대본 — 세션 API·STT 연동 전까지 화면 흐름을 흉내 낸다. 연동 후 이 파일은 제거된다.
// 오프닝은 시나리오의 openingPreview에서 시드하고, 후속 턴은 예시 대본으로 채운다.
import type { ThoughtType } from '@/features/onboarding/ui/ThoughtCard';
import type { Scenario } from '@/features/scenario/api/list';

// [시뮬] 발화 타이핑 시간 — TTS 연동 전까지 글자 수 기반으로 말하는 시간을 흉내 낸다
export const speechTypingMs = (text: string) =>
  Math.max(1400, text.length * 45);

// [시뮬] 답변이 한 단어씩 채워지는 간격 — STT 실시간 트랜스크립트로 교체될 자리
export const WORD_FILL_MS = 260;

// 속마음 노출 유지 시간 — 긴 문장은 읽을 시간을 더 준다 (연동 후에도 유지되는 연출 페이싱)
export const thoughtHoldMs = (text: string) =>
  Math.min(2600 + text.length * 40, 5200);

export interface SimTurn {
  aiMessage: string; // 화면에 크게 보이는 상대 발화(또는 유저 선발화 안내)
  aiTranslation: string | null;
  userAnswer: string; // 듣는 중 좌→우로 채워질 답변 샘플
  innerThought: string; // 답변 후 Sona가 전하는 상대 속마음
  innerThoughtType: ThoughtType;
}

// 백엔드 innerThoughtType이 미열거 문자열이라 안전하게 좁힌다
const toThoughtType = (value: string | null): ThoughtType =>
  value === 'GOOD' || value === 'NORMAL' || value === 'BAD' ? value : 'NORMAL';

// 카페 주문 흐름이 앞 턴의 답변을 이어받도록 짠 대본 — 속마음은 점원이 내 발화를 듣고 느낄 법한 반응
const FOLLOW_UP_TURNS: SimTurn[] = [
  {
    aiMessage: 'One iced americano. What size would you like?',
    aiTranslation: '아이스 아메리카노 하나요. 사이즈는 어떻게 드릴까요?',
    userAnswer: 'Grande, please.',
    innerThought: '사이즈 질문에 망설임 없이 답하네. 잘 통했어.',
    innerThoughtType: 'NORMAL',
  },
  {
    aiMessage: 'Got it. Anything else with that, like a dessert?',
    aiTranslation: '알겠어요. 디저트 같은 것도 함께 드릴까요?',
    userAnswer: 'No thanks, that’s all.',
    innerThought: '짧아도 예의 있게 사양했어. 알아듣기 편했어.',
    innerThoughtType: 'NORMAL',
  },
  {
    aiMessage: 'That’ll be five fifty. Are you paying by card?',
    aiTranslation: '5달러 50센트입니다. 카드로 결제하시나요?',
    userAnswer: 'Yes, here you go.',
    innerThought: '주문부터 결제까지 막힘이 없었어. 또 왔으면 좋겠다!',
    innerThoughtType: 'GOOD',
  },
];

export const buildSimTurns = (scenario: Scenario): SimTurn[] => {
  const preview = scenario.openingPreview;

  // firstSpeaker가 USER면 오프닝 카드는 발화 유도 문구가 된다
  const openingMessage =
    scenario.firstSpeaker === 'USER'
      ? (preview?.userOpeningInstruction ?? '먼저 인사를 건네보세요!')
      : (preview?.aiOpeningMessage ??
        'Hi! Welcome in. What can I get for you today?');

  const opening: SimTurn = {
    aiMessage: openingMessage,
    aiTranslation:
      scenario.firstSpeaker === 'USER'
        ? null
        : (preview?.aiOpeningMessageTranslation ??
          '어서 오세요! 오늘은 뭘 드릴까요?'),
    userAnswer: 'Hi, can I get an iced americano, please?',
    innerThought:
      preview?.innerThought ??
      '오, 발음이 또렷한데? 주문을 한 번에 알아들었어.',
    innerThoughtType: toThoughtType(preview?.innerThoughtType ?? null),
  };

  return [opening, ...FOLLOW_UP_TURNS];
};
