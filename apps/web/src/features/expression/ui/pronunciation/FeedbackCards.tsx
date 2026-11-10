'use client';

// 교정 단어 피드백 카드 목록 — 행마다 원어민/나 라벨로 구분하고 듣기는 공용 ListenButton
import { useTranslations } from 'next-intl';

import type { PronunciationWord } from '../../api/pronunciation';
import type {
  DisplaySegment,
  FeedbackCard,
} from '../../model/pronunciation-feedback';
import { wordTone, type ScoreTone } from '../../model/pronunciation-score';
import { ListenButton } from './ListenButton';
import { WORD_TONE_TEXT } from './word-tone-text';

interface FeedbackCardsProps {
  cards: FeedbackCard[];
  // 재도전 녹음 중 — 포인터는 본문이 막지만 키보드 활성화까지 막으려면 버튼이 알아야 한다
  disabled: boolean;
  // 지금 재생 중인 소리의 식별자 — 행별 듣기 버튼이 자기 차례에만 재생 상태를 그린다
  playingId: string | null;
  // 원어민 단어 발음 재생 — CDN URL이 없으면 버튼을 숨긴다
  onPlayNative: (word: PronunciationWord) => void;
  // 단어 음원을 준비한 경우에만 내 발음 듣기 버튼을 표시한다
  canPlayMine: (word: PronunciationWord) => boolean;
  onPlayMine: (word: PronunciationWord) => void;
}

/** 원어민 단어 음원의 재생 식별자 — 재생 호출과 버튼 상태가 같은 규칙을 써야 맞는다 */
export const nativeWordAudioId = (order: number) => `native-${order}`;
/** 내 녹음 구간 재생 식별자 */
export const myWordAudioId = (order: number) => `mine-${order}`;
/** 단어 칩 → 교정 카드 스크롤 이동용 앵커 id */
export const feedbackCardId = (order: number) => `pronunciation-word-${order}`;

// 카드가 많아도 칩을 눌러 이동할 때 빈자리가 오래 보이지 않게 순차 등장은 여기까지만 늦춘다
const MAX_STAGGERED_CARDS = 4;

export const FeedbackCards = ({
  cards,
  disabled,
  playingId,
  onPlayNative,
  canPlayMine,
  onPlayMine,
}: FeedbackCardsProps) => {
  const t = useTranslations('expression.feedbackCards');
  return (
    <div className="flex flex-col gap-5">
      {cards.map((card, cardIndex) => {
        const { word } = card;
        const playNative = word.nativeWordAudioUrl
          ? () => onPlayNative(word)
          : undefined;
        const playMine = canPlayMine(word) ? () => onPlayMine(word) : undefined;

        return (
          // scroll-mt로 앵커 이동 시 헤더에 가리지 않게 여유를 둔다 (단어 칩에서 이동해 온다).
          // 등장은 칩·말풍선 다음 차례 — 카드가 순서대로 떠오른다
          <section
            key={word.order}
            id={feedbackCardId(word.order)}
            className="animate-fade-up scroll-mt-16"
            style={{
              animationDelay: `${1100 + Math.min(cardIndex, MAX_STAGGERED_CARDS) * 120}ms`,
            }}
          >
            <div className="rounded-2xl border border-border bg-card px-4 py-4">
              <div className="mb-3 flex items-center gap-2">
                <p className="text-lg font-extrabold text-foreground">
                  {word.word}
                </p>
                <ToneBadge tone={wordTone(word)} />
              </div>
              {card.kind === 'stress' && (
                <div className="mb-3 flex gap-3 text-11 font-medium text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Dot className="bg-success" /> {t('nativeStressCaption')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Dot className="bg-destructive" /> {t('mineStressCaption')}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <PronRow
                  label={t('nativeRowLabel')}
                  listenLabel={t('nativeListenLabel')}
                  onPlay={playNative}
                  disabled={disabled}
                  playing={playingId === nativeWordAudioId(word.order)}
                >
                  {card.kind !== 'stress' ? (
                    <Respelling segments={card.native} tone="native" />
                  ) : (
                    <SyllableWord
                      syllables={card.syllables}
                      dotIndex={card.stressIndex}
                      tone="native"
                    />
                  )}
                </PronRow>
                <PronRow
                  label={t('mineRowLabel')}
                  listenLabel={t('mineListenLabel')}
                  onPlay={playMine}
                  disabled={disabled}
                  playing={playingId === myWordAudioId(word.order)}
                >
                  {card.kind === 'phoneme' && (
                    <Respelling segments={card.user} tone="mine" />
                  )}
                  {card.kind === 'stress' && (
                    <SyllableWord
                      syllables={card.syllables}
                      dotIndex={card.userStressIndex}
                      tone="mine"
                    />
                  )}
                  {card.kind === 'lowScore' && (
                    <p
                      className={`text-xl font-bold ${WORD_TONE_TEXT[wordTone(word)]}`}
                    >
                      {card.user}
                    </p>
                  )}
                </PronRow>
              </div>

              {word.coachingText && (
                <p className="mt-3.5 rounded-xl bg-muted px-3.5 py-2.5 text-sm leading-relaxed font-medium text-foreground">
                  {word.coachingText}
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};

// 제목 옆 배지 — 노랑은 조금 어색함, 빨강은 연습 필요. 초록은 달지 않는다
const ToneBadge = ({ tone }: { tone: ScoreTone }) => {
  const t = useTranslations('expression.feedbackCards');
  if (tone === 'green') return null;
  return tone === 'yellow' ? (
    <span className="rounded-lg bg-awkward-bg px-2 py-[3px] text-xs font-bold text-awkward-ink">
      {t('awkwardBadge')}
    </span>
  ) : (
    <span className="rounded-lg bg-destructive/10 px-2 py-[3px] text-xs font-bold text-destructive">
      {t('needsPracticeBadge')}
    </span>
  );
};

// 발음 비교 한 행 — 맨 앞 라벨(원어민/나) + 표기 + 공용 듣기 버튼
const PronRow = ({
  label,
  listenLabel,
  onPlay,
  playing,
  disabled,
  children,
}: {
  label: string;
  // 듣기 버튼의 접근성 이름
  listenLabel: string;
  onPlay?: () => void;
  playing: boolean;
  disabled: boolean;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-2.5">
    <span className="w-12 flex-none text-sm font-semibold text-muted-foreground">
      {label}
    </span>
    <div className="min-w-0 flex-1">{children}</div>
    {onPlay && (
      <ListenButton
        playing={playing}
        onClick={onPlay}
        disabled={disabled}
        ariaLabel={listenLabel}
      />
    )}
  </div>
);

// 원어민 행은 맞는 발음이라 빨강을 쓰지 않는다 — 대비 구간은 밑줄로만 짚어준다.
// 빨강(오류)은 내 발음 행의 틀린 구간에만 쓴다
const Respelling = ({
  segments,
  tone,
}: {
  segments: DisplaySegment[];
  tone: 'native' | 'mine';
}) => (
  <p className="text-xl font-bold text-success">
    {segments.map((segment, index) => (
      <span
        key={index}
        className={
          segment.error
            ? tone === 'native'
              ? 'underline decoration-2 underline-offset-4'
              : 'text-destructive underline decoration-2 underline-offset-4'
            : undefined
        }
      >
        {segment.text}
      </span>
    ))}
  </p>
);

// 음절 위 점으로 강세 위치를 표시한다 — 원어민은 초록, 내 것은 빨강
const SyllableWord = ({
  syllables,
  dotIndex,
  tone,
}: {
  syllables: string[];
  dotIndex: number | null;
  tone: 'native' | 'mine';
}) => (
  <span className="inline-flex">
    {syllables.map((syllable, index) => {
      const stressed = index === dotIndex;
      return (
        <span
          key={index}
          // pt로 점 자리를 만들고 점은 글자 쪽에 붙인다 — ing처럼 위로 솟는 글자가 없는 음절에서도 점이 떠 보이지 않게
          className={`relative px-0.5 pt-3.5 text-xl font-bold ${
            stressed
              ? tone === 'native'
                ? 'rounded bg-success/15 text-foreground'
                : 'rounded bg-destructive/10 text-foreground'
              : 'text-muted-foreground'
          }`}
        >
          {stressed && (
            <span
              className={`absolute top-[7px] left-1/2 size-1.5 -translate-x-1/2 rounded-full ${
                tone === 'native' ? 'bg-success' : 'bg-destructive'
              }`}
            />
          )}
          {syllable}
        </span>
      );
    })}
  </span>
);

const Dot = ({ className }: { className: string }) => (
  <span className={`size-1.5 rounded-full ${className}`} />
);
