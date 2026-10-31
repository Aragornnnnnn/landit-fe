// 대화 기록의 말풍선 — 지난 대화를 대화처럼 다시 보여 준다. 스몰톡과 롤플레이 대화 기록이 같이 쓴다.
// 대화 화면의 말풍선은 TTS·마이크가 얽혀 있어 여기서는 읽기 전용으로 새로 그린다.
// 대화 중엔 교정을 보여주지 않는 대신, 여기서 내 말풍선 아래에 더 자연스러운 말과 배운 표현 재사용을 붙인다
import { useTranslations } from 'next-intl';

import { splitMatchedText } from '@/shared/lib/matched-text';
import { Emoji } from '@/shared/ui/emoji';
import { CheckIcon, SparkleIcon } from '@/shared/ui/Icons';

import type {
  SmallTalkCorrection,
  SmallTalkHistoryMessage,
  SmallTalkReusedExpression,
} from '../api/small-talk';

// 말풍선이 읽는 칸만 — 롤플레이 기록은 교정 상태(correctionStatus)를 주지 않아 없을 수 있다
export type TranscriptMessage = Pick<
  SmallTalkHistoryMessage,
  | 'messageId'
  | 'content'
  | 'translatedContent'
  | 'correction'
  | 'reusedExpression'
  | 'correctionStatus'
>;

// 상대 말은 왼쪽에 번역까지 — 교정·표현 재사용은 내 말에만 있는 것이라 여기엔 아무것도 안 붙는다
export const PartnerMessage = ({ message }: { message: TranscriptMessage }) => (
  <div className="flex justify-start">
    <div className="max-w-[78%] rounded-2xl bg-card px-4 py-3 shadow-sm">
      <p className="text-15 leading-6 font-medium text-foreground">
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

// 내 말은 오른쪽에 원문만 — 내가 한 말은 번역이 필요 없다.
// 그 아래에 배운 표현 태그 → (교정을 아직 만드는 중이면 찾는 중 한 줄) → 교정 카드 순으로 붙는다.
// 고칠 게 없었으면 교정 카드 자리에 잘했어요 한 줄이 선다
export const MyMessage = ({
  message,
  waitExpired,
  lateCorrection,
}: {
  message: TranscriptMessage;
  // 상한까지 기다려 더는 묻지 않는 상태 — 찾는 중 표시를 거둔다. 만들어지면 다음에 들어올 때 보인다
  waitExpired: boolean;
  // 이 말풍선의 교정이 폴링으로 뒤늦게 왔는가 — 그때만 카드를 떠오르게 한다
  lateCorrection: boolean;
}) => {
  const t = useTranslations('smallTalk.transcript');
  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="max-w-[78%] rounded-2xl bg-primary px-4 py-3 text-white">
        <p className="text-15 leading-6 font-medium">
          <HighlightedContent
            content={message.content}
            matchedText={message.reusedExpression?.matchedText}
          />
        </p>
      </div>
      {message.reusedExpression && (
        <ReusedExpressionTag expression={message.reusedExpression} />
      )}
      {message.correctionStatus === 'PREPARING' && !waitExpired && (
        <p className="text-12 text-muted-foreground">{t('preparingCaption')}</p>
      )}
      {message.correction ? (
        <CorrectionCard
          correction={message.correction}
          className={lateCorrection ? 'animate-fade-up' : ''}
        />
      ) : (
        // 실패(FAILED)나 준비 중(PREPARING)도 교정이 없다 — 다 만들고 고칠 게 없었을 때만 칭찬한다
        message.correctionStatus === 'COMPLETED' && <GoodJobTag />
      )}
    </div>
  );
};

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

// 더 자연스러운 말 — 고친 문장은 초록 굵게, 이유는 회색.
// 말풍선 가족과 같은 모양을 쓴다(같은 둥글기·여백, 테두리 없이 채움만) — 테두리를 두면 이 카드만 따로 논다.
// 내 말풍선보다 조금 넓게 잡아 고친 문장이 덜 접히게 한다.
// 장기기억을 근거로 고쳤으면 그 근거를 날짜 태그로 보여준다
const CorrectionCard = ({
  correction,
  className = '',
}: {
  correction: SmallTalkCorrection;
  className?: string;
}) => {
  const t = useTranslations('smallTalk.transcript');
  return (
    <section
      className={`max-w-[88%] rounded-2xl bg-success/10 px-4 py-3 ${className}`}
    >
      <p className="flex items-center gap-1 text-12 font-semibold text-success">
        <SparkleIcon size={13} />
        {t('correctionTitle')}
      </p>
      <p className="mt-1.5 text-15 leading-6 font-bold text-success">
        {correction.betterSentence}
      </p>
      <p className="mt-1.5 text-13 leading-5 text-muted-foreground">
        {correction.reason}
      </p>
      {correction.memoryTag && (
        <p className="mt-2 inline-block rounded-full bg-card px-2.5 py-1 text-12 text-muted-foreground">
          <Emoji>🗓️</Emoji> {correction.memoryTag}
        </p>
      )}
    </section>
  );
};
