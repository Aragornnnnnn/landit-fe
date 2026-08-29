'use client';

// 표현 설명 단독 스텝 (B안) — 히어로 이미지 + 표현·발음 듣기 + 래디 말풍선. 발음 평가 전에 뜻·뉘앙스를 각인한다
import { Button } from '@/shared/ui/Button';

import { StepScaffold } from '../common/StepScaffold';
import { KaraokeSentence } from '../pronunciation/KaraokeSentence';
import { ListenButton } from '../pronunciation/ListenButton';
import { SentenceListenBlock } from '../pronunciation/SentenceListenBlock';

interface ExpressionIntroStepProps {
  targetExpressionText: string;
  baseExpressionMeaningText: string;
  usageDescription: string;
  // 대표 예문 미리보기 — 다음(발음) 스텝에서 말할 바로 그 문장을 먼저 보여준다
  sentenceText: string;
  sentenceTranslation: string;
  // 대표 예문 이미지 — 표현 뉘앙스 시각화. 없으면 이미지 영역을 접는다
  imageUrl: string | null;
  // 표현 줄·예문 줄 스피커 (사전 카드처럼 각각). 표현 전용 TTS는 BE 노출 대기라 당장은 둘 다 문장 음원
  onPlayExpressionAudio: () => void;
  playingExpressionAudio: boolean;
  // 표현 재생 진행률 0~1 — 타이틀 글자가 순서대로 물든다
  expressionAudioProgress: number;
  onPlaySentenceAudio: () => void;
  playingSentenceAudio: boolean;
  // 예문 재생 진행률 0~1 — 글자가 순서대로 물든다
  sentenceAudioProgress: number;
  progress: number;
  onBack: () => void;
  leftAction?: 'back' | 'close';
  onNext: () => void;
  // 발음을 이미 거친 뒤 설명을 다시 보러 온 경우 "다음"으로 바뀐다
  nextLabel?: string;
  // 마이크를 쓸 수 없는 상황을 위한 발음 건너뛰기 (기획 확정 동선). 재방문 땐 없다
  onSkip?: () => void;
}

export const ExpressionIntroStep = ({
  targetExpressionText,
  baseExpressionMeaningText,
  usageDescription,
  sentenceText,
  sentenceTranslation,
  imageUrl,
  onPlayExpressionAudio,
  playingExpressionAudio,
  expressionAudioProgress,
  onPlaySentenceAudio,
  playingSentenceAudio,
  sentenceAudioProgress,
  progress,
  onBack,
  leftAction,
  onNext,
  nextLabel = '소리 내서 말해볼게요',
  onSkip,
}: ExpressionIntroStepProps) => (
  <StepScaffold
    progress={progress}
    onBack={onBack}
    leftAction={leftAction}
    headerOverlay
    footer={
      <div className="flex flex-col items-center gap-2">
        <Button size="md" onClick={onNext}>
          {nextLabel}
        </Button>
        {onSkip && (
          <button
            onClick={onSkip}
            className="py-1 text-sm font-semibold text-muted-foreground active:opacity-70"
          >
            지금은 말할 수 없어요
          </button>
        )}
      </div>
    }
  >
    <div className="flex flex-col pb-6">
      {imageUrl && (
        // 히어로 이미지는 좌우 풀블리드 — 스캐폴드 본문 여백(px-5)을 상쇄해 화면 폭을 다 쓴다
        <div className="-mx-5 overflow-hidden bg-secondary">
          {/* eslint-disable-next-line @next/next/no-img-element -- 예문 이미지 도메인 미정이라 next/image 원격 허용 목록을 아직 못 만든다 */}
          <img
            src={imageUrl}
            alt=""
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      )}

      {/* 사전 카드 구성 — 표현·뜻 단락과 예문 단락을 구분선으로 나누고, 스피커는 줄마다 하나씩
          상단 고정(items-start) — 텍스트가 몇 줄이든 첫 줄 기준 같은 높이에 선다 */}
      <div className="mt-4 flex items-start gap-3">
        {/* 긴 표현은 한 단계 줄여 줄바꿈을 최소화한다 */}
        <h1
          className={`min-w-0 flex-1 leading-tight font-extrabold text-foreground ${
            targetExpressionText.length > 20 ? 'text-2xl' : 'text-[28px]'
          }`}
        >
          <KaraokeSentence
            text={targetExpressionText}
            highlight={targetExpressionText}
            progress={expressionAudioProgress}
          />
        </h1>
        <ListenButton
          playing={playingExpressionAudio}
          onClick={onPlayExpressionAudio}
          ariaLabel="표현 발음 듣기"
        />
      </div>
      <p className="mt-2 text-base font-medium text-muted-foreground">
        {baseExpressionMeaningText}
      </p>

      <div className="mt-6 border-t border-border" />

      {/* 대표 예문 — 검정 바탕에 표현만 굵게(사전 스타일), 재생하면 소리에 맞춰 글자가 물든다 */}
      <div className="mt-4">
        <SentenceListenBlock
          sentenceText={sentenceText}
          sentenceTranslation={sentenceTranslation}
          highlight={targetExpressionText}
          onPlay={onPlaySentenceAudio}
          playing={playingSentenceAudio}
          progress={sentenceAudioProgress}
        />
      </div>

      <div className="mt-6 flex items-end gap-3">
        {/* 말풍선(설명)을 가리키는 래디 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/character/landy-point.webp"
          alt=""
          className="w-[72px] flex-none object-contain"
        />
        <div className="min-w-0 flex-1 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3.5">
          <p className="text-[15px] leading-relaxed font-medium text-foreground">
            {usageDescription}
          </p>
        </div>
      </div>
    </div>
  </StepScaffold>
);
