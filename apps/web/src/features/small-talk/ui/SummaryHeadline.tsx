// 대화 요약 맨 위의 래디와 회색 말풍선 두 줄 — 지난번 대비 가장 좋아진 것 하나를 사실(숫자)과 의미로 말한다.
// 오늘의 스몰톡과 오늘의 롤플레이가 같이 쓴다
import type { SmallTalkSummaryHeadline } from '../api/small-talk';
import { RandiBubble } from './RandiBubble';

export const SummaryHeadline = ({
  headline,
}: {
  headline: SmallTalkSummaryHeadline;
}) => (
  <RandiBubble pose={headline.pose}>
    <p>{headline.text}</p>
    <p>{headline.subline}</p>
  </RandiBubble>
);
