// 받은 편지의 본문 — 공지·업데이트는 블록 본문, 답장은 글 한 덩이에 내가 보낸 내용이 따라붙는다
import type { ReceivedLetterDetail } from '../../api/mailbox';
import { readLetterBlocks } from '../../model/letter-blocks';
import { LetterBlocks } from './LetterBlocks';
import { QuotedLetter } from './QuotedLetter';

export const ReceivedBody = ({ letter }: { letter: ReceivedLetterDetail }) => {
  const blocks = readLetterBlocks(letter.contentBlocks);
  if (blocks.length > 0) return <LetterBlocks blocks={blocks} />;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[15px] leading-relaxed text-foreground">
        {letter.bodyText}
      </p>
      {/* 답장에 딸린 내 원문 — 무엇에 대한 답장인지 다시 찾아보지 않게 한다 */}
      {letter.quotedFeedbackContent && (
        <QuotedLetter text={letter.quotedFeedbackContent} />
      )}
    </div>
  );
};
