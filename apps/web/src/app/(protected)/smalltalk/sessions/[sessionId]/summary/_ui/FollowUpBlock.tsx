// 다음 스몰톡에서 — 장기기억으로 만든 후속 질문. 여기서 던진 질문을 다음 대화의 첫 마디에서 상대가 실제로 꺼낸다
import type { SmallTalkSummaryFollowUp } from '@/features/small-talk/api/small-talk';
import { FOLLOW_UP_IMAGE } from '@/features/small-talk/model/randi-pose';

export const FollowUpBlock = ({
  followUp,
}: {
  followUp: SmallTalkSummaryFollowUp;
}) => (
  <section>
    <h2 className="text-[13px] font-bold text-foreground">다음 스몰톡에서</h2>
    <div className="mt-2 flex items-end gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={FOLLOW_UP_IMAGE}
        alt=""
        className="shrink-0 object-contain"
        // 원본 282×480 비율. 스켈레톤 자리에 뒤늦게 서는 블록이라 그림이 오기 전에도 폭을 잡아 둔다
        style={{ width: 33, height: 56 }}
      />
      <div className="flex-1 rounded-2xl rounded-bl-sm bg-secondary px-4 py-3">
        <p className="text-[15px] leading-6 font-bold break-keep text-foreground">
          {followUp.question}
        </p>
        <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
          {followUp.invite}
        </p>
      </div>
    </div>
  </section>
);
