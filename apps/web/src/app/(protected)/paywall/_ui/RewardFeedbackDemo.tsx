// 환급 페이월 혜택 02 「문장마다 꼼꼼한 상세 피드백」의 다섯 장 — 실제 상세 분석·총평 화면의 조각을 가짜 대화 하나로 채워 그린다.
// 화면을 따라 그리지 않고 실제 컴포넌트를 쓰니, 피드백 화면이 바뀌면 여기도 같이 바뀐다. 조회·계측이 붙은 화면 껍데기는 빼고 본문만 쓴다
import type {
  MessageFeedbackResponse,
  ScenarioExpressionReuseItem,
  ScenarioGrowthCard,
} from '@/features/feedback/api/session-feedback';
import { TurnCard } from '@/features/feedback/ui/flow/FeedbackDetail';
import { SummaryCard } from '@/features/feedback/ui/flow/FeedbackSummary';
import { ScoreTrack } from '@/features/feedback/ui/flow/ScoreTrack';
import { SummaryLevelCard } from '@/features/feedback/ui/flow/SummaryLevelCard';
import { GrowthCard } from '@/features/feedback/ui/GrowthCard';
import { ReusedExpressionsCard } from '@/features/feedback/ui/ReusedExpressionsCard';
import { ChevronLeftIcon } from '@/shared/ui/Icons';
import { StarRating } from '@/shared/ui/StarRating';

import { DemoScreen, type DemoProps } from './DemoScreen';

const SCENARIO_TITLE = '입주 첫날, 룸메이트 Marco와 첫 만남';

/** 장마다 내려 둔 거리(390폭 기준 px) — 잘한 이유·고친 문장·영역 점수가 폰 안에 들어오는 자리 */
const GOOD_SCROLL = 210;
const BETTER_SCROLL = 170;
const SUMMARY_SCROLL = 262;

const GOOD_TURN: MessageFeedbackResponse = {
  messageFeedbackId: 1,
  messageId: 1,
  turnNumber: 1,
  userMessage:
    "Hi Marco! I'm Junseo. I'm from Korea and I study computer science.",
  evaluationContext: {
    type: 'AI_MESSAGE',
    content:
      "Wait, you're my roommate? I'm Marco, an exchange student from Spain. Tell me about yourself!",
    translatedContent:
      '잠깐, 네가 내 룸메이트야? 난 스페인에서 온 교환학생 마르코야. 너에 대해 알려 줘!',
  },
  feedbackType: 'GOOD',
  baseLocaleAnalogy:
    '“안녕 마르코! 난 준서야. 한국에서 왔고 컴퓨터공학 전공해.” 정도로 들려요.',
  feedbackDetail:
    '이름, 출신, 전공을 한 번에 말해서 상대가 다음 질문을 이어 가기 쉬웠어요.',
  benchmarkMessage:
    "I'm from Korea and I study ~ 처럼 두 가지를 and로 이어 말해 원어민처럼 자연스러웠어요.",
  positiveFeedback: null,
  correctionExpression: null,
  correctionReason: null,
};

const BETTER_TURN: MessageFeedbackResponse = {
  messageFeedbackId: 2,
  messageId: 2,
  turnNumber: 2,
  userMessage: 'I like playing guitar. It is fun.',
  evaluationContext: {
    type: 'AI_MESSAGE',
    content: 'Nice! So what do you do for fun? What got you into it?',
    translatedContent: '좋다! 그럼 넌 재미로 뭐 해? 어떻게 시작하게 됐어?',
  },
  feedbackType: 'NEEDS_IMPROVEMENT',
  baseLocaleAnalogy: '“기타 치는 거 좋아해. 그거 재밌어.” 정도로 들려요.',
  feedbackDetail: null,
  benchmarkMessage: null,
  correctionExpression:
    "I'm really into playing guitar. I got into it because my dad used to play.",
  correctionReason:
    '어떻게 시작했는지도 물었으니 이유를 한 문장 붙이면 대화가 이어져요. be into는 ‘푹 빠져 있다’는 느낌이에요.',
  positiveFeedback: '좋아하는 걸 바로 말해서 질문에 곧장 답했어요.',
};

/** 총평 「이번 대화에서」 — 영역 이름은 실제 총평 카드와 같다 */
const LEVEL_ROWS = [
  { key: 'situationPerformance', label: '상황 대처 능력', score: 82 },
  { key: 'vocabulary', label: '어휘력', score: 64 },
  { key: 'grammar', label: '문법', score: 58 },
  { key: 'discourse', label: '문장 완성도', score: 71 },
  { key: 'interactionPragmatics', label: '대화 매너', score: 90 },
] as const;

const GROWTH: ScenarioGrowthCard = {
  pattern: 'PAST_TENSE',
  patternLabel: '과거형',
  succeeded: true,
  previousDate: '2026-09-28T21:03:11',
  previousSentence: 'I go to Busan last summer.',
  previousWrongSpan: 'go',
  currentSentence: 'I got into it because my dad used to play.',
  currentSpan: 'got',
};

const REUSED: ScenarioExpressionReuseItem[] = [
  {
    expressionId: 1,
    text: 'be into',
    meaning: '~에 푹 빠져 있다',
    sourceLabel: '10월 7일 시나리오',
    messageId: 2,
    quotedSentence: "I'm really into playing guitar.",
    matchedText: 'into',
  },
  {
    expressionId: 2,
    text: 'get into',
    meaning: '~을 시작하게 되다',
    sourceLabel: '10월 7일 시나리오',
    messageId: 2,
    quotedSentence: 'I got into it because my dad used to play.',
    matchedText: 'got into',
  },
  {
    expressionId: 3,
    text: 'used to',
    meaning: '예전엔 ~하곤 했다',
    sourceLabel: '10월 5일 표현 학습',
    messageId: 2,
    quotedSentence: 'My dad used to play.',
    matchedText: 'used to',
  },
];

/** 상세 분석 머리 — 실제 화면처럼 뒤로·제목 한 줄 아래에 몇 번째 턴인지 막대 */
const DetailHeader = ({ index }: { index: number }) => (
  <header className="flex flex-col gap-3 px-4 pt-4 pb-3.5">
    <div className="flex items-center">
      <span className="flex h-7 w-[21px] items-center justify-center text-muted-foreground">
        <ChevronLeftIcon size={24} strokeWidth={2.4} />
      </span>
      <p className="flex-1 pr-[21px] text-center text-lg font-bold text-foreground">
        상세 분석
      </p>
    </div>
    <div className="flex gap-1.5">
      {[0, 1, 2].map((turn) => (
        <span
          key={turn}
          className={`h-[3px] flex-1 rounded-sm ${turn <= index ? 'bg-primary' : 'bg-border'}`}
        />
      ))}
    </div>
  </header>
);

/** 총평 머리 — 뒤로와 시나리오 제목, 아래 구분선 */
const SummaryHeader = () => (
  <header className="flex items-center gap-2 border-b border-border px-4 pt-4 pb-3">
    <span className="flex h-7 w-[21px] items-center justify-center text-muted-foreground">
      <ChevronLeftIcon size={24} strokeWidth={2.4} />
    </span>
    <p className="flex-1 truncate text-center text-lg font-bold text-foreground">
      {SCENARIO_TITLE}
    </p>
    <span className="w-7" />
  </header>
);

/**
 * 내려 본 본문 — 머리는 제자리에 두고 본문만 by(px)만큼 올린다. 카드 속 폰은 위쪽 560px쯤만 보여서,
 * 장마다 핵심(잘한 이유·고친 문장·영역 점수)이 그 안에 들어오게 실제로 스크롤한 자리처럼 둔다
 */
const Scrolled = ({
  by,
  children,
}: {
  by: number;
  children: React.ReactNode;
}) => (
  <div className="min-h-0 flex-1 overflow-hidden">
    <div style={{ marginTop: -by }}>{children}</div>
  </div>
);

/** ① 잘한 문장 — 왜 잘 통했는지 */
export const GoodTurnDemo = ({ width }: DemoProps) => (
  <DemoScreen width={width}>
    <div className="flex h-full flex-col">
      <DetailHeader index={0} />
      <Scrolled by={GOOD_SCROLL}>
        <div className="px-5">
          <TurnCard turn={GOOD_TURN} />
        </div>
      </Scrolled>
    </div>
  </DemoScreen>
);

/** ② 어색한 문장 — 이렇게 하면 더 통한다 */
export const BetterTurnDemo = ({ width }: DemoProps) => (
  <DemoScreen width={width}>
    <div className="flex h-full flex-col">
      <DetailHeader index={1} />
      <Scrolled by={BETTER_SCROLL}>
        <div className="px-5">
          <TurnCard turn={BETTER_TURN} />
        </div>
      </Scrolled>
    </div>
  </DemoScreen>
);

/** ③ 대화 전체 총평 — 별점·한 줄 평·원어민 이해도, 총평과 영역 점수 */
export const SummaryDemo = ({ width }: DemoProps) => (
  <DemoScreen width={width}>
    <div className="flex h-full flex-col">
      <SummaryHeader />
      <Scrolled by={SUMMARY_SCROLL}>
        <div className="px-6 pt-[18px]">
          <div className="flex flex-col gap-[7px]">
            <StarRating rating={2} size={32} />
            <p className="text-23 leading-[1.28] font-bold break-keep text-foreground">
              이제 새 룸메이트와 어색하지 않게 인사할 수 있어요!
            </p>
          </div>
          <div className="mt-[18px]">
            <ScoreTrack score={72} />
          </div>
          <p className="mt-5 text-base font-semibold text-foreground">
            3번 중 <span className="text-primary">1번</span> 원어민처럼 말했어요
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <SummaryCard title="총평">
              <p className="text-15 leading-[1.6] text-foreground">
                자기소개는 이름·출신·전공을 한 번에 전해 좋았어요. 취미를 말할
                때는 이유를 한 문장 덧붙여 보세요.
              </p>
            </SummaryCard>
            <SummaryLevelCard
              rows={[...LEVEL_ROWS]}
              improvement="취미를 말할 때 이유를 한 문장 덧붙이면 대화가 더 길게 이어져요."
            />
          </div>
        </div>
      </Scrolled>
    </div>
  </DemoScreen>
);

/** ④ 지난번보다 나아진 점 — 성장 카드 하나만, 작은 폰 안에서도 읽히게 1.3배로 키워 둔다 */
export const GrowthDemo = ({ width }: DemoProps) => (
  <DemoScreen width={width}>
    <SummaryHeader />
    <div className="[zoom:1.3] px-4 pt-6">
      <GrowthCard growth={GROWTH} />
    </div>
  </DemoScreen>
);

/** ⑤ 배운 표현을 실제로 썼는지 — 배운 표현 카드만. 셋이면 접지 않고 다 보여 준다 */
export const ReuseDemo = ({ width }: DemoProps) => (
  <DemoScreen width={width}>
    <SummaryHeader />
    <div className="px-6 pt-[18px]">
      <ReusedExpressionsCard items={REUSED} />
    </div>
  </DemoScreen>
);
