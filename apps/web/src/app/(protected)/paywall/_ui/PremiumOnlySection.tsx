// 「프리미엄에서만 할 수 있는 것들」의 본문 — 표현 학습·시나리오·스몰톡 세 시리즈. 헤드라인은 PaywallHero에 있다.
// 시리즈마다 좌우로 넘기는 카드 한 줄이라 세로로는 짧고, 더 보고 싶은 사람만 옆으로 넘긴다(다음 카드가 오른쪽에 살짝 보여 넘길 수 있는 줄 안다).
// 피드백은 시나리오·스몰톡 시리즈 마지막 장에 있다. 화면 번호는 데모마다 다 나온 뒤의 대표 장면이라 정지 화면으로 읽힌다. 시나리오 첫 카드만 「많았다가 하나로」를 되풀이한다
import { ExampleDemo } from './ExampleDemo';
import { AnalysisDemo, MistakeDemo } from './FeedbackDemo';
import { PronunciationDemo } from './PronunciationDemo';
import { QuizDemo } from './QuizDemo';
import { ScenarioDemo } from './ScenarioDemo';
import { ScenarioPickLive } from './ScenarioPickLive';
import { SERIES_SCREEN_WIDTH, SeriesCarousel } from './SeriesCarousel';
import { SmallTalkDemo } from './SmallTalkDemo';
import { UsageDemo } from './UsageDemo';

const width = SERIES_SCREEN_WIDTH;

export const PremiumOnlySection = () => (
  <div className="flex flex-col gap-10 pt-8">
    <SeriesCarousel
      label="맞춤형 원어민 표현 제공"
      items={[
        {
          title: '그림과 예문으로 실제 뉘앙스까지',
          screen: <ExampleDemo step={2} width={width} />,
        },
        {
          title: '원어민처럼 발음하게 만들어드려요',
          screen: <PronunciationDemo step={3} width={width} />,
        },
        {
          title: '여러 예문으로 확실히 내 표현으로',
          screen: <UsageDemo step={0} width={width} />,
        },
        {
          title: '퀴즈로 내 것이 됐는지 확인해요',
          screen: <QuizDemo step={2} width={width} />,
        },
      ]}
    />

    <SeriesCarousel
      label="시나리오"
      items={[
        {
          title: '해외에서 마주칠 상황, 매일 하나씩',
          screen: <ScenarioPickLive width={width} />,
        },
        {
          title: '그 상황 그대로 실제처럼 대화해요',
          screen: <ScenarioDemo step={3} width={width} />,
        },
        {
          title: '대화가 끝나면 꼼꼼하게 분석해요',
          screen: <AnalysisDemo step={1} width={width} />,
        },
      ]}
    />

    <SeriesCarousel
      label="스몰톡"
      items={[
        {
          title: '원하는 친구와 억양까지 골라서',
          screen: <SmallTalkDemo step={2} width={width} />,
        },
        {
          title: '주제 없이 자유롭게 대화해요',
          screen: <SmallTalkDemo step={3} width={width} />,
        },
        {
          title: '자주 하는 실수까지 잡아줘요',
          screen: <MistakeDemo step={1} width={width} />,
        },
      ]}
    />
  </div>
);
