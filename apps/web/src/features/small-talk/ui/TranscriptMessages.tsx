// 대화 기록의 말풍선 — 지난 대화를 대화처럼 다시 보여 준다. 스몰톡과 롤플레이 대화 기록이 같이 쓴다.
// 대화 화면의 말풍선은 TTS·마이크가 얽혀 있어 여기서는 읽기 전용으로 새로 그린다.
// 대화 중엔 교정을 보여주지 않는 대신, 여기서 내 말을 문장별로 고쳐 보여 주고 배운 표현 재사용을 붙인다
import { useTranslations } from 'next-intl';

import { splitMatchedText } from '@/shared/lib/matched-text';
import { Emoji } from '@/shared/ui/emoji';
import { ArrowRightIcon, CheckIcon } from '@/shared/ui/Icons';

import type {
  SmallTalkHistoryMessage,
  SmallTalkReusedExpression,
  TextRange,
  TranscriptSentence,
} from '../api/small-talk';
import {
  groupSentences,
  hasSentenceCorrection,
  splitByRanges,
} from '../model/sentence-corrections';

// 말풍선이 읽는 칸만 — 상대 말이나 교정을 시작하지 않은 말엔 교정 상태가 없다
export type TranscriptMessage = Pick<
  SmallTalkHistoryMessage,
  | 'messageId'
  | 'content'
  | 'translatedContent'
  | 'sentences'
  | 'reusedExpression'
  | 'correctionStatus'
>;

// 상대 말은 대화 화면의 상대 말풍선과 같은 흰 바탕·왼위 꼬리로, 번역까지 — 교정·표현 재사용은 내 말에만 있는 것이라 여기엔 아무것도 안 붙는다
export const PartnerMessage = ({ message }: { message: TranscriptMessage }) => (
  <div className="flex justify-start">
    <div className="max-w-[78%] rounded-[18px] rounded-tl-md bg-card px-3.5 py-[9px] shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
      <p className="text-16 leading-[1.35] font-bold text-foreground">
        {message.content}
      </p>
      {message.translatedContent && (
        <p className="mt-1.5 text-13 leading-5 text-muted-foreground">
          {message.translatedContent}
        </p>
      )}
    </div>
  </div>
);

// 내 말은 오른쪽에 — 내가 한 말은 번역이 필요 없다.
// 대화 화면의 지난 내 말풍선과 같은 연한 주황·오른위 꼬리로 그린다. 고친 문장이 없으면 원문만, 있으면 문장별로 고쳐 보여 준다.
// 그 아래에 배운 표현 태그 → (교정을 아직 만드는 중이면 찾는 중 한 줄) → (고칠 게 없었으면 잘했어요) 순으로 붙는다
export const MyMessage = ({
  message,
  waitExpired,
  lateCorrection,
}: {
  message: TranscriptMessage;
  // 상한까지 기다려 더는 묻지 않는 상태 — 찾는 중 표시를 거둔다. 만들어지면 다음에 들어올 때 보인다
  waitExpired: boolean;
  // 이 말풍선의 교정이 폴링으로 뒤늦게 왔는가 — 그때만 말풍선을 떠오르게 한다
  lateCorrection: boolean;
}) => {
  const t = useTranslations('smallTalk.transcript');
  const corrected = hasSentenceCorrection(message.sentences);
  return (
    <div className="flex flex-col items-end gap-1.5">
      {corrected ? (
        <CorrectedBubble
          sentences={message.sentences}
          className={lateCorrection ? 'animate-fade-up' : ''}
        />
      ) : (
        <div className="max-w-[78%] rounded-[18px] rounded-tr-md bg-bubble-mine px-3.5 py-[9px] shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
          <p className="text-16 leading-[1.35] font-medium text-foreground">
            <HighlightedContent
              content={message.content}
              matchedText={message.reusedExpression?.matchedText}
            />
          </p>
        </div>
      )}
      {message.reusedExpression && (
        <ReusedExpressionTag expression={message.reusedExpression} />
      )}
      {message.correctionStatus === 'PREPARING' && !waitExpired && (
        <p className="text-12 text-muted-foreground">{t('preparingCaption')}</p>
      )}
      {/* 실패(FAILED)나 준비 중(PREPARING)도 고친 문장이 없다 — 다 만들고 고칠 게 없었을 때만 칭찬한다 */}
      {!corrected && message.correctionStatus === 'COMPLETED' && <GoodJobTag />}
    </div>
  );
};

// 고친 문장이 있는 말 — 고칠 게 없는 문장은 원문대로 이어 붙이고, 고친 문장은 하나씩 따로 세운다.
// 묶음 사이엔 가는 줄을 긋는다. 고친 문장이 덜 접히게 원문 말풍선보다 조금 넓게 잡는다
const CorrectedBubble = ({
  sentences,
  className,
}: {
  sentences: TranscriptSentence[];
  className: string;
}) => (
  <div
    className={`max-w-[88%] divide-y divide-bubble-mine-live/40 rounded-[18px] rounded-tr-md bg-bubble-mine px-3.5 shadow-[0_4px_14px_rgba(0,0,0,0.06)] ${className}`}
  >
    {groupSentences(sentences).map((block, index) =>
      block.kind === 'plain' ? (
        <p
          key={index}
          className="py-3 text-16 leading-[1.35] font-medium text-foreground"
        >
          {block.text}
        </p>
      ) : (
        <SentenceCorrection key={index} sentence={block.sentence} />
      ),
    )}
  </div>
);

// 고친 문장 하나 — 원문의 틀린 부분은 회색 취소선, 그 아래 → 고친 문장(바뀐 부분만 초록), 회색 팁.
// 장기기억을 근거로 고쳤으면 그 근거를 흰 알약으로 붙인다
const SentenceCorrection = ({ sentence }: { sentence: TranscriptSentence }) => {
  const correction = sentence.correction!;
  return (
    <div className="py-3">
      <p className="text-16 leading-[1.35] font-medium text-foreground">
        <MarkedText
          text={sentence.text}
          ranges={sentence.strikes}
          as="del"
          className="text-muted-foreground"
        />
      </p>
      <p className="mt-2 flex gap-1.5 text-16 leading-[1.35] font-bold text-foreground">
        <ArrowRightIcon
          size={16}
          strokeWidth={2.5}
          className="mt-1 shrink-0 text-success"
        />
        <span>
          <MarkedText
            text={correction.fixed}
            ranges={correction.changes}
            as="ins"
            className="text-success no-underline"
          />
        </span>
      </p>
      <p className="mt-1 pl-[22px] text-13 leading-5 text-muted-foreground">
        {correction.tip}
      </p>
      {correction.memory && (
        // 연한 주황 바탕에선 초록 글씨가 묻혀 흰 알약에 담는다
        <p className="mt-2 ml-[22px] inline-block rounded-full bg-card px-2.5 py-1 text-12 font-semibold text-success">
          <Emoji>🗓️</Emoji> {correction.memory.label}
        </p>
      )}
    </div>
  );
};

// 범위 안 조각만 지운 글(del)·고친 글(ins)로 감싼다 — 취소선(원문)과 초록 칠(고친 문장)이 같은 자르기를 쓴다
const MarkedText = ({
  text,
  ranges,
  as: Mark,
  className,
}: {
  text: string;
  ranges: TextRange[];
  as: 'del' | 'ins';
  className: string;
}) =>
  splitByRanges(text, ranges).map((part, index) =>
    part.marked ? (
      <Mark key={index} className={className}>
        {part.text}
      </Mark>
    ) : (
      part.text
    ),
  );

// 배운 표현을 쓴 구절만 밑줄 — 구절을 못 찾으면 원문 그대로
const HighlightedContent = ({
  content,
  matchedText,
}: {
  content: string;
  matchedText?: string;
}) => {
  const split = splitMatchedText(content, matchedText);
  if (!split) return content;

  return (
    <>
      {split.before}
      <u className="underline decoration-2 underline-offset-4">{split.match}</u>
      {split.after}
    </>
  );
};

// 말풍선 아래 연초록 한 줄 — 배운 표현을 실제로 썼다는 표시
const ReusedExpressionTag = ({
  expression,
}: {
  expression: SmallTalkReusedExpression;
}) => {
  const t = useTranslations('smallTalk.transcript');
  return (
    <p className="flex items-center gap-1 rounded-full bg-success/10 px-3 py-1.5 text-12 font-semibold text-success">
      <CheckIcon size={12} strokeWidth={3} />
      {t('reusedExpressionBadge', { expression: expression.text })}
    </p>
  );
};

// 고칠 게 없던 말 — 배운 표현 태그와 같은 알약, 색만 파랑(잘한 것을 파랑으로 쓰는 피드백 상세와 같은 토큰)
const GoodJobTag = () => {
  const t = useTranslations('smallTalk.transcript');
  return (
    <p className="flex items-center gap-1 rounded-full bg-good/10 px-3 py-1.5 text-12 font-semibold text-good">
      <CheckIcon size={12} strokeWidth={3} />
      {t('goodJobBadge')}
    </p>
  );
};
