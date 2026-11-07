'use client';

// AI 발화 재생 훅 — 오프닝은 서버가 준 첫 질문 음원, 이후엔 TTS 합성, 음성이 없으면 글자 수 타이머로 폴백한다.
// 발화가 맞장구(ttsText)와 고정 질문 음원(questionAudioUrl)으로 나뉘어 오면 맞장구만 합성하고 음원을 이어 튼다
import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { getSpeechRate } from '@/shared/lib/speech-rate';
import {
  TtsTimeoutError,
  useTts,
  type TtsPlayback,
  type TtsStallSnapshot,
} from '@/shared/tts/useTts';
import type { TtsVoice } from '@/shared/tts/voice';

import { speechEndPauseMs, speechTypingMs } from './pacing';
import { splitSpeechChunks } from './speech-chunks';

/** 지금 소리 나고 있는 발화 — 캐릭터가 이 둘로 입모양을 맞춘다 */
export interface PlayingSpeech {
  playback: TtsPlayback;
  text: string;
}

/**
 * 발화 재생 소스 — content는 화면에 보이는 전체 문장이고,
 * 맞장구와 질문 음원이 둘 다 있을 때만 분리 재생한다(아니면 content 전체를 합성)
 */
export interface SpeechSource {
  content: string;
  ttsText?: string | null;
  fixedQuestionText?: string | null;
  questionAudioUrl?: string | null;
}

// 재생 계획 — 분리 소스가 다 있으면 합성은 맞장구만 맡고 고정 질문은 음원이 잇는다. 재생과 프리페치가 같은 판정을 쓴다.
// 합성은 문장 조각으로 나눠 맡긴다 — 합성 시간이 길이에 비례해, 앞 조각부터 틀면 소리가 빨리 시작된다
const resolveSpeechPlan = (source: SpeechSource) => {
  const { content, ttsText, fixedQuestionText, questionAudioUrl } = source;
  if (!ttsText || !questionAudioUrl) {
    return { synthChunks: splitSpeechChunks(content), question: null };
  }
  return {
    synthChunks: splitSpeechChunks(ttsText),
    question: {
      src: questionAudioUrl,
      // 질문 구간 입모양용 텍스트 — 질문 원문 필드를 쓰고, 없으면(구 응답) content에서 맞장구를 뗀 나머지다
      lipSyncText:
        fixedQuestionText ??
        (content.startsWith(ttsText)
          ? content.slice(ttsText.length).trim()
          : content),
    },
  };
};

// 한 발화가 동시에 거는 합성 수 — 제공사 동시 요청 한도를 아끼면서, 다음 문장이 앞 문장 재생이 끝나기 전에 준비될 만큼
// TODO: 동시 대화가 80명을 넘거나 Sentry에 합성 429가 보이면 요금제 한도를 다시 재고 서버 쪽 대기열이나 스트리밍을 검토한다 (11/5 실측 한도 약 40개, 최고 동시 대화 1~2명 추정)
const SYNTH_CONCURRENCY = 3;

// 문장들을 앞에서부터 합성해 둔다. 하나가 끝나면 다음 문장을 건다
const prefetchChunks = (
  tts: ReturnType<typeof useTts>,
  chunks: string[],
  voice: TtsVoice,
  isStopped: () => boolean = () => false,
) => {
  let next = 0;
  const work = async () => {
    while (next < chunks.length && !isStopped())
      await tts.prefetch(chunks[next++], voice);
  };
  for (let slot = 0; slot < SYNTH_CONCURRENCY; slot++) void work();
};

// 재생 한 회차가 빌려 쓰는 것들 — 훅의 상태(setSpeech)와 재생 수단(tts)을 주입받아 회차 상태는 함수 안에 갇힌다
interface SpeechRunDeps {
  source: SpeechSource;
  voice: TtsVoice | null;
  // 오프닝 발화일 때만 채워지는 첫 질문 음원 URL
  openingSrc: string | null;
  tts: ReturnType<typeof useTts>;
  setSpeech: (speech: PlayingSpeech | null) => void;
  // 이 발화의 소리가 시작됐거나, 낼 소리 없이 넘어갔다 — 화면이 글자를 내보내도 된다
  onSoundStart: () => void;
  onSpeechEnd: () => void;
  // 계측용 세션 id — 세션이 없는 재생(스몰톡 탭 인사)은 null
  sessionId: number | null;
  // 재생이 멈추면 소리는 둔 채 발화 종료를 먼저 알릴지 — 다시 듣기는 턴과 무관해 걸지 않는다
  releaseOnStall: boolean;
}

/** 재생 한 회차의 손잡이 — stop은 소리까지 끊고, released는 멈춤으로 종료를 먼저 알렸는지다 */
interface SpeechRun {
  stop: () => void;
  released: () => boolean;
}

// 상대의 발화 한 회차를 소리로 낸다 — 오프닝이면 첫 질문 음원을, 이후엔 맞장구 합성(+질문 음원 이어 재생)을 틀고
// 발화 종료 통지까지 책임진다. 시작시키고 손잡이를 돌려주므로 effect가 그대로 cleanup으로 쓴다
const runSpeech = ({
  source,
  voice,
  openingSrc,
  tts,
  setSpeech,
  onSoundStart,
  onSpeechEnd,
  sessionId,
  releaseOnStall,
}: SpeechRunDeps): SpeechRun => {
  const { content } = source;

  // 이 회차가 이미 정리된 뒤 도착한 콜백은 무시한다 — 재생을 되살리거나 턴을 넘기면 안 된다 (React 공식 effect 관례)
  let ignore = false;
  // 합성 실패 계측은 발화당 한 번 — 문장 수만큼 쌓이면 실패율이 부풀어 보인다
  let synthFailureTracked = false;
  // 응답이 끝내 안 왔다 — 남은 문장은 틀지 않으니 합성도 더 걸지 않는다
  let gaveUp = false;
  // 타이머 폴백의 중단 손잡이 — 정리 시점에 오디오(tts.stop)와 함께 멈춘다
  let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
  // 재생이 멈춰 종료를 먼저 알렸다 — 소리는 이어지지만 종료는 두 번 알리지 않는다
  let released = false;

  // 소리가 끝나면 입도 멈춰야 한다 — 남겨두면 마지막 입모양에서 굳는다
  const finish = () => {
    if (ignore) return;
    onSoundStart();
    setSpeech(null);
    if (!released) onSpeechEnd();
  };
  // 재생이 멈추면 소리는 둔 채 턴부터 넘긴다 — 글자는 화면에 있으니 읽고 말하면 되고, 소리가 다시 나면 끝까지 들린다
  const releaseTurn =
    (playbackSource: 'synth' | 'question_audio') =>
    (snapshot: TtsStallSnapshot) => {
      if (ignore || released) return;
      released = true;
      track(EVENTS.SPEECH_PLAYBACK_STALLED, {
        session_id: sessionId ?? undefined,
        source: playbackSource,
        started: snapshot.started,
        position_ms: snapshot.positionMs,
        ready_state: snapshot.readyState,
        network_state: snapshot.networkState,
        paused: snapshot.paused,
        last_media_event: snapshot.lastMediaEvent,
      });
      onSoundStart();
      setSpeech(null);
      onSpeechEnd();
    };
  const onStallOf = (playbackSource: 'synth' | 'question_audio') =>
    releaseOnStall ? releaseTurn(playbackSource) : undefined;
  // 입모양은 지금 나는 소리를 따른다 — 분리 재생에선 구간마다 텍스트가 다르다
  const startLipSync = (playback: TtsPlayback, text: string) => {
    if (!ignore) onSoundStart();
    setSpeech({ playback, text });
  };

  // tts 콜백을 Promise로 감싼 구간 재생기 셋 — 실패해도 resolve해서 발화가 멈추지 않고 다음 구간으로 이어진다

  // 합성해서 말한다. 실패는 계측만 남기고 그 구간을 건너뛴다. 응답이 끝내 안 왔는지를 돌려줘 호출부가 더 기다릴지 정한다
  const speakSynth = (text: string, synthVoice: TtsVoice) =>
    new Promise<boolean>((resolve) => {
      void tts.speak(text, synthVoice, {
        onStart: (playback) => startLipSync(playback, text),
        onEnd: () => resolve(false),
        onStall: onStallOf('synth'),
        onError: (error) => {
          if (!ignore && !synthFailureTracked) {
            synthFailureTracked = true;
            track(EVENTS.SPEECH_PLAYBACK_FAILED, {
              session_id: sessionId ?? undefined,
              source: 'synth',
            });
          }
          resolve(error instanceof TtsTimeoutError);
        },
      });
    });

  // 미리 만든 음원을 튼다. 끝까지 재생했는지를 돌려줘 호출부가 폴백을 결정한다
  const playAudio = (src: string, lipSyncText: string) =>
    new Promise<boolean>((resolve) => {
      tts.speakSrc(src, {
        onStart: (playback) => startLipSync(playback, lipSyncText),
        onEnd: () => resolve(true),
        onStall: onStallOf('question_audio'),
        onError: () => {
          if (!ignore)
            track(EVENTS.SPEECH_PLAYBACK_FAILED, {
              session_id: sessionId ?? undefined,
              source: 'question_audio',
            });
          setSpeech(null);
          resolve(false);
        },
      });
    });

  // 소리 없이 말하는 시간만큼 기다린다 (음성 미설정이어도 대화가 멈추지 않게)
  const waitSpeechTime = (text: string) =>
    new Promise<void>((resolve) => {
      onSoundStart();
      fallbackTimer = setTimeout(
        resolve,
        speechTypingMs(text, getSpeechRate()) + speechEndPauseMs,
      );
    });

  const speakThrough = async () => {
    // 1) 오프닝은 서버가 준 첫 질문 음원부터 튼다 — 성공하면 그대로 발화 끝, 실패하면 아래 일반 재생으로 폴백.
    // 멈춰서 이미 턴을 넘긴 뒤의 실패는 폴백하지 않는다 — 내 차례에 처음부터 다시 말하면 안 된다
    if (openingSrc) {
      const played = await playAudio(openingSrc, content);
      if (ignore) return;
      if (played || released) return finish();
    }

    // 2) 목소리가 없으면 입을 맞출 오디오도 없다 — 캐릭터는 음절 흉내로 돌아간다
    if (!voice) {
      await waitSpeechTime(content);
      return finish();
    }

    // 3) 맞장구(분리 재생이 아니면 문장 전체)를 조각별로 합성해 말한다.
    // 뒤 조각도 지금 합성을 걸어 둔다 — 앞 조각이 끝날 때 기다리지 않고 바로 잇는다. 미리 받아 뒀으면 다시 합성하지 않는다
    const { synthChunks, question } = resolveSpeechPlan(source);
    prefetchChunks(tts, synthChunks, voice, () => ignore || gaveUp);
    for (const chunk of synthChunks) {
      const timedOut = await speakSynth(chunk, voice);
      if (ignore) return;
      // 응답이 끝내 안 왔다 — 남은 문장마다 다시 기다리면 대화가 오래 멈춰서 합성은 여기서 접는다
      if (timedOut) {
        gaveUp = true;
        break;
      }
    }

    // 4) 질문 음원이 있으면 이어 튼다 — 실패해도(대신 낼 소리가 없어) 발화는 여기서 끝난다
    if (question) {
      setSpeech(null);
      await playAudio(question.src, question.lipSyncText);
    }
    finish();
  };
  void speakThrough();

  return {
    stop: () => {
      ignore = true;
      tts.stop();
      clearTimeout(fallbackTimer);
      setSpeech(null);
    },
    released: () => released,
  };
};

/** playing은 지금이 AI 발화 단계인지다 — phase가 AI_SPEAKING이고 재생할 발화가 있을 때 참이다 */
interface AiSpeechOptions {
  playing: boolean;
  source: SpeechSource | null;
  voice: TtsVoice | null;
  // 오프닝의 첫 질문 음원 URL — 없으면(null) 오프닝도 일반 재생 경로를 탄다
  openingSrc: string | null;
  onSpeechEnd: () => void;
  // 다시 듣기를 허용하는 구간인가 — 꺼지는 순간 돌던 다시 듣기도 함께 끊는다. 안 주면 다시 듣기가 없는 재생이다
  replayAllowed?: boolean;
  // 계측용 세션 id — 재생 실패가 어느 대화에서 났는지 남긴다
  sessionId?: number | null;
}

/**
 * AI 발화 재생 훅 — playing이 켜지면 source를 계획대로 재생하고(오프닝 mp3·합성·질문 음원), 끝나면 onSpeechEnd를 부른다.
 *
 * @returns `markOpeningPlayed`(오프닝을 지나갔다는 표시), `prefetch`(다음 발화 미리 준비),
 *   `speech`(지금 나는 소리 — 캐릭터 입모양용, 소리가 없으면 null),
 *   `waitingForSound`(재생할 차례인데 소리가 아직 안 났다),
 *   `replay`·`replaying`(다시 듣기 — 대화 진행과 무관한 별도 재생, replayAllowed 구간에서만)
 */
export const useAiSpeech = ({
  playing,
  source,
  voice,
  openingSrc,
  onSpeechEnd,
  replayAllowed = false,
  sessionId = null,
}: AiSpeechOptions) => {
  const tts = useTts();
  // 첫 AI 발화(오프닝)인지 — 첫 질문 음원 재생 대상
  const isOpeningRef = useRef(true);
  // 재생이 시작돼야 알 수 있는 값이라 상태로 둔다 (오프닝 mp3·합성 어느 쪽이든 같다)
  const [speech, setSpeech] = useState<PlayingSpeech | null>(null);
  // 다시 듣기 회차의 중단 손잡이 — 이 회차는 effect가 아니라 버튼이 시작하므로 정리도 직접 들고 있어야 한다
  const replayStopRef = useRef<(() => void) | null>(null);
  const [replaying, setReplaying] = useState(false);
  // 멈춤으로 턴을 먼저 넘긴 회차의 중단 손잡이 — 소리는 남겨 두고, 마이크를 켜거나 화면을 떠나거나 새로 틀 때 끊는다
  const lingeringStopRef = useRef<(() => void) | null>(null);
  // 소리가 시작된 발화 — 합성을 기다리는 동안 화면이 글자를 먼저 내보내지 않게 알려 준다
  const [soundStartedFor, setSoundStartedFor] = useState<string | null>(null);

  /** 다시 듣기를 끊는다 — 소리와 입모양을 함께 멈춘다. 돌고 있지 않으면 아무 일도 없다 */
  const stopReplay = () => {
    replayStopRef.current?.();
    replayStopRef.current = null;
    setReplaying(false);
    setSoundStartedFor(null);
  };

  /** 멈춤으로 턴을 넘긴 뒤 남겨 둔 소리를 끊는다. 남은 게 없으면 아무 일도 없다 */
  const stopLingering = () => {
    lingeringStopRef.current?.();
    lingeringStopRef.current = null;
  };

  // 다시 듣기는 허용 구간에서만 산다 — 허용이 꺼지는 순간(상대 발화·내 녹음·화면 이탈) 끊는다.
  // 정리 없이 새 발화가 소리를 뺏으면 다시 듣기 회차가 끝을 못 알리고, 내 녹음엔 상대 목소리가 섞인다
  useEffect(() => () => stopReplay(), [replayAllowed]);

  // 남겨 둔 소리도 허용이 꺼지면(내 녹음·답 전송) 끊는다 — 꺼지는 순간에만 끊어, 턴을 막 넘겨받은 소리는 건드리지 않는다
  useEffect(() => {
    if (!replayAllowed) stopLingering();
  }, [replayAllowed]);

  // 오프닝 구간이면 첫 질문 음원을 그대로 튼다 — 이후 발화는 동적 생성이라 음원이 없다
  const resolveOpeningSrc = () => (isOpeningRef.current ? openingSrc : null);

  // 재생 한 회차 — 자동 재생과 다시 듣기가 같은 계획을 쓴다. 다른 건 끝났을 때 누구에게 알리느냐와 멈췄을 때 턴을 넘기느냐뿐이다
  const startSpeech = (
    speechSource: SpeechSource,
    onEnd: () => void,
    releaseOnStall: boolean,
  ) =>
    runSpeech({
      source: speechSource,
      voice,
      openingSrc: resolveOpeningSrc(),
      tts,
      setSpeech,
      onSoundStart: () => setSoundStartedFor(speechSource.content),
      onSpeechEnd: onEnd,
      sessionId,
      releaseOnStall,
    });

  // 발화가 바뀔 때마다 재생 한 회차를 시작한다 — 멈춤으로 턴을 먼저 넘긴 회차만 소리를 남겨 두고, 나머지는 정리 때 끊는다
  useEffect(() => {
    if (!playing || source == null) return;
    stopLingering();
    const run = startSpeech(source, onSpeechEnd, true);
    return () => {
      if (run.released()) lingeringStopRef.current = run.stop;
      else run.stop();
      setSoundStartedFor(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, source?.content, source?.ttsText, source?.questionAudioUrl]);

  // 화면을 떠나면 남겨 둔 소리도 끊는다 — 위 effect 뒤에 두어, 같은 순간에 넘겨받은 소리까지 끊는다
  useEffect(() => stopLingering, []);

  // 다음 발화 재생을 미리 준비한다 — 합성분은 미리 합성하고, 질문 음원은 미리 열어 이어 재생 공백을 없앤다.
  // 음성이 없으면 재생 자체가 타이머 폴백이라 아무것도 준비하지 않는다
  const prefetch = (nextSource: SpeechSource) => {
    if (!voice) return;
    const { synthChunks, question } = resolveSpeechPlan(nextSource);
    prefetchChunks(tts, synthChunks, voice);
    if (question) tts.prefetchSrc(question.src);
  };

  /**
   * 방금 들은 발화를 한 번 더 — 끝나도 onSpeechEnd를 부르지 않는다. 부르는 순간 턴이 넘어가 버리기 때문이다.
   * 재생 중에 다시 부르면 멈추고, 허용 구간 밖에서 부르면 무시한다 — 상대 발화 중에 소리를 뺏으면
   * 그 발화가 끝을 못 알려 대화가 멈춘다. 새로 재생을 시작했는지를 돌려준다(계측용)
   */
  const replay = (): boolean => {
    if (replaying) {
      stopReplay();
      return false;
    }
    if (!replayAllowed || source == null) return false;
    // 남겨 둔 소리를 이어 듣는 대신 처음부터 다시 튼다
    stopLingering();
    // 오프닝은 음원을 그대로 다시 튼다 — 합성을 미리 시켜 봐야 안 쓰인다.
    // 그 외엔 합성분은 방금 튼 게 캐시에 있어 요청이 안 나가고, 질문 음원만 미리 열려 맞장구 뒤 공백이 없어진다
    if (!resolveOpeningSrc()) prefetch(source);
    setReplaying(true);
    replayStopRef.current = startSpeech(source, stopReplay, false).stop;
    return true;
  };

  // 오프닝을 지나갔다는 표시 — 다음 질문이 화면에 올라갈 때 부른다
  const markOpeningPlayed = () => {
    isOpeningRef.current = false;
  };

  const waitingForSound =
    playing && source != null && soundStartedFor !== source.content;

  return {
    markOpeningPlayed,
    prefetch,
    speech,
    waitingForSound,
    replay,
    replaying,
  };
};
