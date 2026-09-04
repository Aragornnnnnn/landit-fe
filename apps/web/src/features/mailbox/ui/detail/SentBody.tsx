// 보낸 피드백의 본문 — 내가 쓴 글이 먼저고, 답장이 도착했으면 그 아래에 붙는다.
// "읽고 있어요"는 replies가 아니라 status로 정한다 — 묶음 답장은 replies 없이 COMPLETED가 될 수 있다
import type { SentFeedbackDetail } from '../../api/mailbox';
import { formatLetterDateTime } from '../../lib/letter-date';
import { MarkdownBody } from './MarkdownBody';
import { WaitingNotice } from './WaitingNotice';

export const SentBody = ({ feedback }: { feedback: SentFeedbackDetail }) => (
  <div className="flex flex-col gap-6">
    <MarkdownBody
      text={feedback.content}
      className="text-[15px] text-foreground"
    />
    {feedback.replies.map((reply) => (
      <ReplySection
        key={reply.letterId}
        text={reply.bodyText}
        sentAt={reply.sentAt}
      />
    ))}
    {feedback.status === 'PENDING' && <WaitingNotice />}
  </div>
);

const ReplySection = ({ text, sentAt }: { text: string; sentAt: string }) => (
  <div className="border-t border-border pt-6">
    <p className="text-xs font-semibold text-muted-foreground">
      랜딧 팀의 답장 · {formatLetterDateTime(sentAt)}
    </p>
    <div className="mt-2">
      <MarkdownBody text={text} className="text-[15px] text-foreground" />
    </div>
  </div>
);
