// 받은 편지의 본문 — 공지·업데이트는 블록 본문, 답장은 글 한 덩이에 내가 보낸 내용이 따라붙는다
import type { ReceivedLetterDetail } from '../../api/mailbox';
import { readLetterBlocks } from '../../model/letter-blocks';
import { isSurveyLetter } from '../../model/survey-letter';
import { LetterBlocks } from './LetterBlocks';
import { QuotedLetter } from './QuotedLetter';
import { SurveyLetterCta } from './SurveyLetterCta';

export const ReceivedBody = ({ letter }: { letter: ReceivedLetterDetail }) => {
  const blocks = readLetterBlocks(letter.contentBlocks);

  return (
    <>
      {blocks.length > 0 ? (
        <LetterBlocks blocks={blocks} />
      ) : (
        <div className="flex flex-col gap-6">
          <p className="text-[15px] leading-relaxed whitespace-pre-line text-foreground">
            {letter.bodyText}
          </p>
          {/* 답장에 딸린 내 원문 — 무엇에 대한 답장인지 다시 찾아보지 않게 한다 */}
          {letter.quotedFeedbackContent && (
            <QuotedLetter text={letter.quotedFeedbackContent} />
          )}
        </div>
      )}
      {/* 설문 안내 편지(임시) — 본문을 다 읽은 자리에서 설문으로 보낸다. 블록 본문이든 글 본문이든 같은 자리 */}
      {isSurveyLetter(letter.letterId) && <SurveyLetterCta />}
    </>
  );
};
