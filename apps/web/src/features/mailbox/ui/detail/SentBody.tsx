// 보낸 피드백의 본문 — 내가 쓴 글이 먼저고, 답장이 도착했으면 그 아래에 붙는다
import type { SentFeedbackDetail } from '../../api/mailbox';
import { formatLetterDateTime } from '../../lib/letter-date';
import { WaitingNotice } from './WaitingNotice';

export const SentBody = ({ feedback }: { feedback: SentFeedbackDetail }) => (
  <div className="flex flex-col gap-6">
    <p className="text-[15px] leading-relaxed text-foreground">
      {feedback.content}
    </p>
    {feedback.replies.length > 0 ? (
      feedback.replies.map((reply) => (
        <ReplySection
          key={reply.letterId}
          text={reply.bodyText}
          sentAt={reply.sentAt}
        />
      ))
    ) : (
      <WaitingNotice />
    )}
  </div>
);

const ReplySection = ({ text, sentAt }: { text: string; sentAt: string }) => (
  <div className="border-t border-border pt-6">
    <p className="text-xs font-semibold text-muted-foreground">
      랜딧 팀의 답장 · {formatLetterDateTime(sentAt)}
    </p>
    <p className="mt-2 text-[15px] leading-relaxed text-foreground">{text}</p>
  </div>
);
