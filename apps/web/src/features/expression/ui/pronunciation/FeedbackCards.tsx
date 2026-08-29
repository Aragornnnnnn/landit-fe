'use client';

// 오류 단어 피드백 카드 목록 — 행마다 원어민/나 라벨로 구분하고 듣기는 공용 ListenButton
import type { PronunciationWord } from '../../api/pronunciation';
import type {
  DisplaySegment,
  FeedbackCard,
} from '../../model/pronunciation-feedback';
import { ListenButton } from './ListenButton';

interface FeedbackCardsProps {
  cards: FeedbackCard[];
  // 지금 재생 중인 소리의 식별자 — 행별 듣기 버튼이 자기 차례에만 재생 상태를 그린다
  playingId: string | null;
  // 원어민 단어 발음 재생 — CDN URL이 없으면 버튼을 숨긴다
  onPlayNative: (word: PronunciationWord) => void;
  // 내 녹음에서 그 단어 구간 재생 — 구간 정보가 없으면 버튼을 숨긴다
  onPlayMine: (word: PronunciationWord) => void;
}

// 재생 식별자 — PronunciationStep의 play 호출과 같은 규칙을 써야 상태가 맞는다
export const nativeWordAudioId = (order: number) => `native-${order}`;
export const myWordAudioId = (order: number) => `mine-${order}`;
// 단어 칩 → 카드 스크롤 이동용 앵커 id
export const feedbackCardId = (order: number) => `pronunciation-word-${order}`;

export const FeedbackCards = ({
  cards,
  playingId,
  onPlayNative,
  onPlayMine,
}: FeedbackCardsProps) => (
  <div className="flex flex-col gap-5">
    {cards.map((card, cardIndex) => {
      const { word } = card;
      const playNative = word.nativeWordAudioUrl
        ? () => onPlayNative(word)
        : undefined;
      const playMine =
        word.startTimeMs !== null && word.endTimeMs !== null
          ? () => onPlayMine(word)
          : undefined;

      return (
        // scroll-mt로 앵커 이동 시 헤더에 가리지 않게 여유를 둔다 (단어 칩에서 이동해 온다).
        // 등장은 칩·말풍선 다음 차례 — 카드가 순서대로 떠오른다
        <section
          key={word.order}
          id={feedbackCardId(word.order)}
          className="animate-fade-up scroll-mt-16"
          style={{ animationDelay: `${1100 + cardIndex * 120}ms` }}
        >
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <p className="mb-3 text-lg font-extrabold text-foreground">
              {word.word}
            </p>
            {card.kind === 'stress' && (
              <div className="mb-3 flex gap-3 text-[11px] font-medium text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Dot className="bg-success" /> 원어민 강세
                </span>
                <span className="flex items-center gap-1">
                  <Dot className="bg-destructive" /> 내가 잘못 강세 넣은 곳
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <PronRow
                label="원어민"
                onPlay={playNative}
                playing={playingId === nativeWordAudioId(word.order)}
              >
                {card.kind === 'phoneme' ? (
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
                label="나"
                onPlay={playMine}
                playing={playingId === myWordAudioId(word.order)}
              >
                {card.kind === 'phoneme' ? (
                  <Respelling segments={card.user} tone="mine" />
                ) : (
                  <SyllableWord
                    syllables={card.syllables}
                    dotIndex={card.userStressIndex}
                    tone="mine"
                  />
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

// 발음 비교 한 행 — 맨 앞 라벨(원어민/나) + 표기 + 공용 듣기 버튼
const PronRow = ({
  label,
  onPlay,
  playing,
  children,
}: {
  label: string;
  onPlay?: () => void;
  playing: boolean;
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
        ariaLabel={`${label} 발음 듣기`}
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
