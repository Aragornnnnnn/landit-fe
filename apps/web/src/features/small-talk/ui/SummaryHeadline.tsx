// 대화 요약 맨 위의 래디와 회색 말풍선 두 줄 — 지난번 대비 가장 좋아진 것 하나를 사실(숫자)과 의미로 말한다.
// 오늘의 스몰톡과 오늘의 롤플레이가 같이 쓴다
import type { SmallTalkSummaryHeadline } from '../api/small-talk';
import { toPoseImage } from '../model/randi-pose';

export const SummaryHeadline = ({
  headline,
}: {
  headline: SmallTalkSummaryHeadline;
}) => (
  <div className="flex items-center gap-3">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={toPoseImage(headline.pose)}
      alt=""
      className="size-20 shrink-0 object-contain"
    />
    {/* 첫 문장엔 닉네임이 들어갈 수 있고 길이 제한이 없다 — 띄어쓰기 없는 긴 이름도 풍선 안에서 끊는다 */}
    <div className="min-w-0 flex-1 rounded-2xl rounded-bl-sm bg-secondary px-4 py-3 [overflow-wrap:anywhere]">
      <p className="text-15 leading-6 font-bold break-keep text-foreground">
        {headline.text}
      </p>
      <p className="text-15 leading-6 font-bold break-keep text-foreground">
        {headline.subline}
      </p>
    </div>
  </div>
);
