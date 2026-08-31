'use client';

// 발음 평가 스텝 — 대기→녹음→분석→피드백(재도전 루프). 점수 구간 표시는 pronunciation-score가 정한다
import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';

// 마이크 컨트롤·권한 시트는 공용 슬라이스(conversation)의 것을 그대로 쓴다 — 대화와 같은 조작감
import { MicControl } from '@/features/conversation/ui/flow/MicControl';
import { MicPermissionSheet } from '@/features/conversation/ui/flow/MicPermissionSheet';
import { track } from '@/shared/analytics';
import { ApiError } from '@/shared/api/api-error';
import { isMicPermissionDeniedError } from '@/shared/stt/errors';
import { Button } from '@/shared/ui/Button';

import type {
  PronunciationAnalysis,
  PronunciationWord,
} from '../../api/pronunciation';
import { isSilentRecording } from '../../lib/sentence-recording';
import { toFeedbackCards } from '../../model/pronunciation-feedback';
import {
  feedbackCoachMessage,
  scoreView,
} from '../../model/pronunciation-score';
import { useAudioPlayer } from '../../model/useAudioPlayer';
import { usePronunciationAnalysisMutation } from '../../model/usePronunciationAnalysisMutation';
import { useSentenceRecorder } from '../../model/useSentenceRecorder';
import { StepScaffold } from '../common/StepScaffold';
import { AnalyzingLandy } from './AnalyzingLandy';
import {
  feedbackCardId,
  FeedbackCards,
  myWordAudioId,
  nativeWordAudioId,
} from './FeedbackCards';
import { ScoreGauge } from './ScoreGauge';
import { SentenceListenBlock } from './SentenceListenBlock';
import { WordChips } from './WordChips';

interface PronunciationStepProps {
  // 설명 재방문 동안 숨김 유지될 때 false — 재생·녹음만 멈추고 피드백 상태는 남긴다
  active?: boolean;
  expressionId: number;
  sentenceText: string;
  sentenceTranslation: string;
  // 문장 안에서 강조할 타겟 표현
  targetExpressionText: string;
  // 대표 예문 히어로 이미지 — 설명 화면과 같은 자리에 그대로 두어 화면 전환감을 줄인다
  imageUrl: string | null;
  // 대표 예문 원어민 TTS — 이 값이 있어야 스텝이 열린다 (게이트는 ExpressionFlow)
  sentenceAudioUrl: string;
  progress: number;
  onBack: () => void;
  // 통과 화면의 X — 뒤로 갈 이유가 없어진 상태라 플로우 나가기(중단 확인)로 연결한다
  onExit: () => void;
  // 다음(추가 예문)으로 — 통과·미통과 모두 이 버튼으로 나간다 (기획: 통과 못 해도 진행 가능)
  onNext: () => void;
  // 발음 자산이 사라진 경우(404) — 파트를 조용히 접고 다음으로
  onUnavailable: () => void;
  // 분석이 결과 화면(피드백·실패)에 도달했을 때 — 플로우가 이 시점부터 이 화면을 보존하고
  // 설명 재방문 CTA를 "다음"으로 바꾼다. 실패 화면도 다시 말하기·다음 CTA가 있어 복귀 지점이 된다
  onSettled?: () => void;
}

type Phase = 'ready' | 'recording' | 'analyzing' | 'failed' | 'feedback';

export const PronunciationStep = ({
  active = true,
  expressionId,
  sentenceText,
  sentenceTranslation,
  targetExpressionText,
  imageUrl,
  sentenceAudioUrl,
  progress,
  onBack,
  onExit,
  onNext,
  onUnavailable,
  onSettled,
}: PronunciationStepProps) => {
  const [phase, setPhase] = useState<Phase>('ready');
  const [analysis, setAnalysis] = useState<PronunciationAnalysis | null>(null);
  const [micSheetOpen, setMicSheetOpen] = useState(false);
  // 녹음이 잘못됐을 때(빈 녹음·INVALID_AUDIO) 다시 유도하는 안내 문구
  const [notice, setNotice] = useState<string | null>(null);
  // 내 녹음 재생용 object URL — 새 녹음이 오면 이전 것을 해제한다
  const recordingUrlRef = useRef<string | null>(null);
  // 분석 회차 — 재도전 포함 몇 번째 결과인지 계측에 싣는다
  const attemptRef = useRef(0);

  const recorder = useSentenceRecorder();
  const analysisMutation = usePronunciationAnalysisMutation(expressionId);
  const player = useAudioPlayer();

  useEffect(
    () => () => {
      if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
    },
    [],
  );

  // 숨김 전환(설명 재방문) — 화면 없이 소리·마이크가 돌지 않게 재생을 끄고 진행 중 녹음은 버린다
  useEffect(() => {
    if (active) return;
    player.stop();
    recorder.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 숨김 전환 시 1회, player·recorder는 안정적이지 않아 제외
  }, [active]);

  // 숨겨지는 순간 녹음 중이었다면 화면 상태도 되돌린다 — props 변화에 맞춘 렌더 중 상태 보정 패턴
  const [prevActive, setPrevActive] = useState(active);
  if (prevActive !== active) {
    setPrevActive(active);
    if (!active && phase === 'recording') {
      setPhase(analysis ? 'feedback' : 'ready');
    }
  }

  // 진입 자동재생은 없다 — 설명 화면에서 표현→예문을 방금 자동으로 들었으므로 여기선 바로 말한다.
  // 다시 듣고 싶으면 예문 스피커(토글)로 듣는다

  const startRecording = async () => {
    setNotice(null);
    // 원어민·내 녹음이 나오는 중이면 끈다 — 스피커 소리가 마이크로 들어가지 않게
    player.stop();
    try {
      await recorder.start();
      setPhase('recording');
    } catch (error) {
      if (isMicPermissionDeniedError(error)) setMicSheetOpen(true);
      else setNotice('마이크를 시작하지 못했어요. 다시 시도해 주세요.');
    }
  };

  // 녹음 취소 — 재도전 중이었다면 보던 피드백으로 돌아간다
  const cancelRecording = () => {
    recorder.abort();
    setPhase(analysis ? 'feedback' : 'ready');
  };

  const submitRecording = async () => {
    const recording = await recorder.stop();
    // 빈 파일이거나 말소리가 담기지 않은 무음이면 업로드 없이 바로 되돌린다
    if (
      !recording ||
      recording.blob.size === 0 ||
      isSilentRecording(recording)
    ) {
      setNotice('녹음된 소리가 없어요. 다시 말해볼까요?');
      setPhase(analysis ? 'feedback' : 'ready');
      return;
    }

    if (recordingUrlRef.current) {
      // 재생 중이던 이전 녹음을 멈추고 해제 — 끊긴 URL로 재생 상태가 굳지 않게
      player.stop();
      URL.revokeObjectURL(recordingUrlRef.current);
    }
    recordingUrlRef.current = URL.createObjectURL(recording.blob);

    setPhase('analyzing');
    analysisMutation.mutate(recording, {
      onSuccess: (result) => {
        attemptRef.current += 1;
        track(EVENTS.PRONUNCIATION_RESULT_VIEWED, {
          expression_id: expressionId,
          score: result.score,
          passed: result.passed,
          error_count: result.words.filter((word) => word.status !== 'CORRECT')
            .length,
          attempt: attemptRef.current,
        });
        setAnalysis(result);
        setPhase('feedback');
        onSettled?.();
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          // 자산이 사라진 경우(재임포트 중 등) — 스텝을 접고 플로우를 막지 않는다
          if (error.status === 404) {
            onUnavailable();
            return;
          }
          if (error.code === 'INVALID_AUDIO') {
            setNotice('녹음이 잘 전달되지 않았어요. 다시 말해볼까요?');
            setPhase(analysis ? 'feedback' : 'ready');
            return;
          }
        }
        setPhase('failed');
        onSettled?.();
      },
    });
  };

  // 듣기 버튼은 전부 토글 — 재생 중 다시 누르면 꺼진다.
  // 계측은 재생 시작만 찍는다 — 같은 id가 나오는 중이면 그 토글은 끄기다
  const trackAudioPlayed = (
    id: string,
    source: 'sentence' | 'native_word' | 'my_word',
  ) => {
    if (player.playingId === id) return;
    track(EVENTS.PRONUNCIATION_AUDIO_PLAYED, {
      expression_id: expressionId,
      source,
    });
  };
  const playNativeSentence = () => {
    trackAudioPlayed('sentence', 'sentence');
    player.toggle(sentenceAudioUrl, { id: 'sentence' });
  };
  const playNativeWord = (word: PronunciationWord) => {
    if (word.nativeWordAudioUrl) {
      trackAudioPlayed(nativeWordAudioId(word.order), 'native_word');
      player.toggle(word.nativeWordAudioUrl, {
        id: nativeWordAudioId(word.order),
      });
    }
  };
  // 단어 구간(startTimeMs~endTimeMs)이 아니라 내 발화 전체를 튼다 —
  // 정렬 모델의 단어 타임스탬프가 부정확해 구간 재생이 어긋날 수 있다 (LAN-402 결정)
  const playMyWord = (word: PronunciationWord) => {
    if (!recordingUrlRef.current) return;
    trackAudioPlayed(myWordAudioId(word.order), 'my_word');
    player.toggle(recordingUrlRef.current, { id: myWordAudioId(word.order) });
  };

  // 재도전(다시 말하기) 녹음은 페이지 이동 없이 이 화면에서 — 교정 팁을 보면서 다시 말하도록
  // 하단만 녹음 컨트롤로 바뀐다. 제출 후 분석은 첫 분석과 같은 로딩 화면으로 전환한다
  if (analysis && (phase === 'feedback' || phase === 'recording')) {
    const view = scoreView(analysis);

    return (
      <StepScaffold
        title="래디의 발음 피드백"
        progress={progress}
        // 통과하면 되돌아갈 이유가 없다 — X(나가기 확인)로 바꾼다. 미통과는 ‹로 재도전 맥락 유지
        leftAction={view.passed ? 'close' : 'back'}
        onBack={view.passed ? onExit : onBack}
        footer={
          phase === 'recording' ? (
            // 녹음 모드 띠 — 경계선과 옅은 배경으로 피드백 열람과 구분한다.
            // 단어만 말하면 된다는 오해 방지 — 재녹음은 문장 전체가 계약이다
            <div className="-mx-5 -mb-[max(env(safe-area-inset-bottom),24px)] border-t border-border bg-secondary/40 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
              <p className="text-center text-sm font-medium text-muted-foreground">
                <span className="font-bold text-foreground">문장 전체</span>를
                처음부터 다시 말해보세요
              </p>
              <MicControl
                phase="USER_SPEAKING"
                onPress={startRecording}
                onCancel={cancelRecording}
                onDone={submitRecording}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Button
                size="md"
                variant={view.passed ? 'success' : 'primary'}
                onClick={onNext}
              >
                추가 예문 보러 갈게요
              </Button>
              {!view.passed && (
                <button
                  onClick={startRecording}
                  className="py-1 text-sm font-semibold text-muted-foreground active:opacity-70"
                >
                  다시 말해보기 ↻
                </button>
              )}
            </div>
          )
        }
      >
        {/* 재도전 녹음 중엔 본문을 살짝 가라앉혀 "지금은 말하는 중" 모드를 구분한다 — 교정 팁은 여전히 읽힌다 */}
        <div
          className={`flex flex-col gap-6 pt-2 pb-6 transition-opacity duration-300 ${
            phase === 'recording' ? 'opacity-60' : ''
          }`}
        >
          <ScoreGauge view={view} />
          <WordChips
            words={analysis.words}
            // 오류 단어 칩을 누르면 해당 피드백 카드로 이동 (통과 화면엔 카드가 없다)
            onSelectWord={
              view.passed
                ? undefined
                : (order) =>
                    document
                      .getElementById(feedbackCardId(order))
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          />
          {view.passed ? (
            // 100 팻말 든 축하 래디 — 통과의 보상 연출이라 큼직하게.
            // 말풍선은 발음 화면의 약속("원어민처럼 말할 수 있게")을 받아 서사를 닫는다
            <div
              className="animate-fade-up flex flex-col items-center gap-1"
              style={{ animationDelay: '600ms' }}
            >
              <div className="rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-base font-bold text-foreground">
                원어민처럼 완벽했어요!
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/character/landy-perfect.webp"
                alt=""
                className="object-contain"
                style={{ width: 170, height: 187 }}
              />
            </div>
          ) : (
            <>
              {/* 발음 화면의 약속("제가 듣고 도와드릴게요")을 지키러 온 래디 — 교정 카드로 시선을 넘긴다 */}
              <div
                className="animate-fade-up -my-1 flex items-center gap-2"
                style={{ animationDelay: '950ms' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/character/landy-point.webp"
                  alt=""
                  className="w-14 flex-none object-contain"
                />
                <div className="rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-2 text-sm font-semibold text-foreground">
                  {feedbackCoachMessage(
                    view,
                    analysis.words.filter((word) => word.status !== 'CORRECT')
                      .length,
                  )}
                </div>
              </div>
              <FeedbackCards
                cards={toFeedbackCards(analysis.words)}
                playingId={player.playingId}
                onPlayNative={playNativeWord}
                onPlayMine={playMyWord}
              />
            </>
          )}
          {notice && <Notice text={notice} />}
        </div>
        <MicPermissionSheet
          open={micSheetOpen}
          onClose={() => setMicSheetOpen(false)}
        />
      </StepScaffold>
    );
  }

  return (
    <StepScaffold progress={progress} onBack={onBack} headerOverlay>
      {/* 오버레이 헤더가 본문 위에 떠 있다 — 히어로 이미지가 없으면 그만큼 자리를 비워준다 */}
      <div
        className={`flex min-h-full flex-col pb-8 ${imageUrl ? '' : 'pt-14'}`}
      >
        {imageUrl && (
          // 설명 화면과 같은 자리의 풀블리드 히어로 — 스텝이 바뀌어도 화면이 이어져 보인다
          <div className="-mx-5 overflow-hidden bg-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element -- 예문 이미지 도메인 미정이라 next/image 원격 허용 목록을 아직 못 만든다 */}
            <img
              src={imageUrl}
              alt=""
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        )}

        {/* 설명 화면에서 아래에 있던 예문이 표현 자리로 부드럽게 올라온다 */}
        <div className="animate-rise-in mt-4">
          <h1 className="text-2xl leading-snug font-extrabold text-foreground">
            방금 배운 표현을 직접 말해보세요
          </h1>
          <div className="mt-4">
            <SentenceListenBlock
              sentenceText={sentenceText}
              sentenceTranslation={sentenceTranslation}
              highlight={targetExpressionText}
              onPlay={playNativeSentence}
              playing={player.playingId === 'sentence'}
              progress={player.playingId === 'sentence' ? player.progress : 0}
            />
          </div>

          {/* 예문 오른쪽 아래에서 래디가 지팡이로 위 문장을 가리키며 말풍선으로 이유를 알려주고,
              녹음이 시작되면 "듣고 있어요"로 바뀌어 계속 지켜본다. 좌우 반전은 CSS 렌더링이라 에셋 원본은 그대로다 */}
          {(phase === 'ready' || phase === 'recording') && (
            <div className="mt-5 flex items-start justify-end gap-2">
              {/* 말풍선은 래디 얼굴보다 살짝 위 — 캐릭터를 아래로 내려 시선이 말풍선→래디→지팡이로 흐른다 */}
              <div className="mt-3 rounded-2xl rounded-br-sm bg-secondary px-3.5 py-2.5 text-sm leading-snug font-semibold text-foreground">
                {phase === 'recording' ? (
                  <span className="animate-pulse">듣고 있어요...</span>
                ) : (
                  <>
                    열심히 듣고 원어민처럼
                    <br />
                    말할 수 있게 도와드릴게요!
                  </>
                )}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/character/landy-point.webp"
                alt=""
                className="mt-7 w-24 flex-none -scale-x-100 object-contain"
              />
            </div>
          )}
        </div>

        {/* 분석 로딩은 래디가 주인공 — 하단 마이크 자리 대신 남는 공간의 세로 중앙에 둔다 */}
        <div
          className={`flex flex-col items-center gap-5 pt-10 ${
            phase === 'analyzing' ? 'my-auto pb-10' : 'mt-auto'
          }`}
        >
          {notice && <Notice text={notice} />}

          {(phase === 'ready' || phase === 'recording') && (
            <>
              {/* 대기 중엔 마이크가 숨 쉬듯 맥동해 "여길 누르라"고 알린다 (발음 화면 전용, 공용 컨트롤은 그대로) */}
              <div
                className={phase === 'ready' ? 'animate-breathe' : undefined}
              >
                <MicControl
                  phase={phase === 'recording' ? 'USER_SPEAKING' : 'USER_READY'}
                  onPress={startRecording}
                  onCancel={cancelRecording}
                  onDone={submitRecording}
                />
              </div>
            </>
          )}

          {phase === 'analyzing' && <AnalyzingLandy />}

          {phase === 'failed' && (
            <div className="flex w-full flex-col items-center gap-3">
              <p className="text-sm font-medium text-muted-foreground">
                분석에 실패했어요. 다시 시도해 주세요.
              </p>
              <Button size="md" onClick={startRecording}>
                다시 말하기
              </Button>
              <Button size="md" variant="ghost" onClick={onNext}>
                추가 예문 보러 갈게요
              </Button>
            </div>
          )}
        </div>
      </div>

      <MicPermissionSheet
        open={micSheetOpen}
        onClose={() => setMicSheetOpen(false)}
      />
    </StepScaffold>
  );
};

const Notice = ({ text }: { text: string }) => (
  <p
    role="alert"
    className="rounded-xl bg-destructive/10 px-4 py-2.5 text-center text-sm font-medium text-destructive"
  >
    {text}
  </p>
);
