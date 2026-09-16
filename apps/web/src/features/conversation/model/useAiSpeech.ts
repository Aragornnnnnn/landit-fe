'use client';

// AI 발화 재생 훅 — 오프닝은 서버가 준 첫 질문 음원, 이후엔 TTS 합성, 음성이 없으면 글자 수 타이머로 폴백한다.
// 발화가 맞장구(ttsText)와 고정 질문 음원(questionAudioUrl)으로 나뉘어 오면 맞장구만 합성하고 음원을 이어 튼다
import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { useTts, type TtsPlayback } from '@/shared/tts/useTts';
import type { TtsVoice } from '@/shared/tts/voice';

import { speechEndPauseMs, speechTypingMs } from './pacing';

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

// 재생 계획 — 분리 소스가 다 있으면 합성은 맞장구만 맡고 고정 질문은 음원이 잇는다. 재생과 프리페치가 같은 판정을 쓴다
const resolveSpeechPlan = (source: SpeechSource) => {
  const { content, ttsText, fixedQuestionText, questionAudioUrl } = source;
  if (!ttsText || !questionAudioUrl) {
    return { synthText: content, question: null };
  }
  return {
    synthText: ttsText,
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

// 재생 한 회차가 빌려 쓰는 것들 — 훅의 상태(setSpeech)와 재생 수단(tts)을 주입받아 회차 상태는 함수 안에 갇힌다
interface SpeechRunDeps {
  source: SpeechSource;
  voice: TtsVoice | null;
  // 오프닝 발화일 때만 채워지는 첫 질문 음원 URL
  openingSrc: string | null;
  tts: ReturnType<typeof useTts>;
  setSpeech: (speech: PlayingSpeech | null) => void;
  onSpeechEnd: () => void;
}

// 상대의 발화 한 회차를 소리로 낸다 — 오프닝이면 첫 질문 음원을, 이후엔 맞장구 합성(+질문 음원 이어 재생)을 틀고
// 발화 종료 통지까지 책임진다. 시작시키고 중단 함수를 돌려주므로 effect가 그대로 cleanup으로 쓴다
const runSpeech = ({
  source,
  voice,
  openingSrc,
  tts,
  setSpeech,
  onSpeechEnd,
}: SpeechRunDeps): (() => void) => {
  const { content } = source;

  // 이 회차가 이미 정리된 뒤 도착한 콜백은 무시한다 — 재생을 되살리거나 턴을 넘기면 안 된다 (React 공식 effect 관례)
  let ignore = false;
  // 타이머 폴백의 중단 손잡이 — 정리 시점에 오디오(tts.stop)와 함께 멈춘다
  let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

  // 소리가 끝나면 입도 멈춰야 한다 — 남겨두면 마지막 입모양에서 굳는다
  const finish = () => {
    if (ignore) return;
    setSpeech(null);
    onSpeechEnd();
  };
  // 입모양은 지금 나는 소리를 따른다 — 분리 재생에선 구간마다 텍스트가 다르다
  const startLipSync = (playback: TtsPlayback, text: string) =>
    setSpeech({ playback, text });

  // tts 콜백을 Promise로 감싼 구간 재생기 셋 — 실패해도 resolve해서 발화가 멈추지 않고 다음 구간으로 이어진다

  // 합성해서 말한다. 실패는 계측만 남기고 그 구간을 건너뛴다
  const speakSynth = (text: string, synthVoice: TtsVoice) =>
    new Promise<void>((resolve) => {
      void tts.speak(text, synthVoice, {
        onStart: (playback) => startLipSync(playback, text),
        onEnd: resolve,
        onError: () => {
          if (!ignore)
            track(EVENTS.SPEECH_PLAYBACK_FAILED, { source: 'synth' });
          resolve();
        },
      });
    });

  // 미리 만든 음원을 튼다. 끝까지 재생했는지를 돌려줘 호출부가 폴백을 결정한다
  const playAudio = (src: string, lipSyncText: string) =>
    new Promise<boolean>((resolve) => {
      tts.speakSrc(src, {
        onStart: (playback) => startLipSync(playback, lipSyncText),
        onEnd: () => resolve(true),
        onError: () => {
          if (!ignore)
            track(EVENTS.SPEECH_PLAYBACK_FAILED, { source: 'question_audio' });
          setSpeech(null);
          resolve(false);
        },
      });
    });

  // 소리 없이 말하는 시간만큼 기다린다 (음성 미설정이어도 대화가 멈추지 않게)
  const waitSpeechTime = (text: string) =>
    new Promise<void>((resolve) => {
      fallbackTimer = setTimeout(
        resolve,
        speechTypingMs(text) + speechEndPauseMs,
      );
    });

  const speakThrough = async () => {
    // 1) 오프닝은 서버가 준 첫 질문 음원부터 튼다 — 성공하면 그대로 발화 끝, 실패하면 아래 일반 재생으로 폴백
    if (openingSrc) {
      const played = await playAudio(openingSrc, content);
      if (ignore) return;
      if (played) return finish();
    }

    // 2) 목소리가 없으면 입을 맞출 오디오도 없다 — 캐릭터는 음절 흉내로 돌아간다
    if (!voice) {
      await waitSpeechTime(content);
      return finish();
    }

    // 3) 맞장구(분리 재생이 아니면 문장 전체)를 합성해 말한다
    const { synthText, question } = resolveSpeechPlan(source);
    await speakSynth(synthText, voice);
    if (ignore) return;

    // 4) 질문 음원이 있으면 이어 튼다 — 실패해도(대신 낼 소리가 없어) 발화는 여기서 끝난다
    if (question) {
      setSpeech(null);
      await playAudio(question.src, question.lipSyncText);
    }
    finish();
  };
  void speakThrough();

  return () => {
    ignore = true;
    tts.stop();
    clearTimeout(fallbackTimer);
    setSpeech(null);
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
}

/**
 * AI 발화 재생 훅 — playing이 켜지면 source를 계획대로 재생하고(오프닝 mp3·합성·질문 음원), 끝나면 onSpeechEnd를 부른다.
 *
 * @returns `markOpeningPlayed`(오프닝을 지나갔다는 표시), `prefetch`(다음 발화 미리 준비),
 *   `speech`(지금 나는 소리 — 캐릭터 입모양용, 소리가 없으면 null),
 *   `replay`·`replaying`(다시 듣기 — 대화 진행과 무관한 별도 재생, replayAllowed 구간에서만)
 */
export const useAiSpeech = ({
  playing,
  source,
  voice,
  openingSrc,
  onSpeechEnd,
  replayAllowed = false,
}: AiSpeechOptions) => {
  const tts = useTts();
  // 첫 AI 발화(오프닝)인지 — 첫 질문 음원 재생 대상
  const isOpeningRef = useRef(true);
  // 재생이 시작돼야 알 수 있는 값이라 상태로 둔다 (오프닝 mp3·합성 어느 쪽이든 같다)
  const [speech, setSpeech] = useState<PlayingSpeech | null>(null);
  // 다시 듣기 회차의 중단 손잡이 — 이 회차는 effect가 아니라 버튼이 시작하므로 정리도 직접 들고 있어야 한다
  const replayStopRef = useRef<(() => void) | null>(null);
  const [replaying, setReplaying] = useState(false);

  /** 다시 듣기를 끊는다 — 소리와 입모양을 함께 멈춘다. 돌고 있지 않으면 아무 일도 없다 */
  const stopReplay = () => {
    replayStopRef.current?.();
    replayStopRef.current = null;
    setReplaying(false);
  };

  // 다시 듣기는 허용 구간에서만 산다 — 허용이 꺼지는 순간(상대 발화·내 녹음·화면 이탈) 끊는다.
  // 정리 없이 새 발화가 소리를 뺏으면 다시 듣기 회차가 끝을 못 알리고, 내 녹음엔 상대 목소리가 섞인다
  useEffect(() => () => stopReplay(), [replayAllowed]);

  // 오프닝 구간이면 첫 질문 음원을 그대로 튼다 — 이후 발화는 동적 생성이라 음원이 없다
  const resolveOpeningSrc = () => (isOpeningRef.current ? openingSrc : null);

  // 재생 한 회차 — 자동 재생과 다시 듣기가 같은 계획을 쓴다. 다른 건 끝났을 때 누구에게 알리느냐뿐이다
  const startSpeech = (speechSource: SpeechSource, onEnd: () => void) =>
    runSpeech({
      source: speechSource,
      voice,
      openingSrc: resolveOpeningSrc(),
      tts,
      setSpeech,
      onSpeechEnd: onEnd,
    });

  // 발화가 바뀔 때마다 재생 한 회차를 시작한다 — 돌려받은 중단 함수가 그대로 cleanup이다
  useEffect(() => {
    if (!playing || source == null) return;
    return startSpeech(source, onSpeechEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, source?.content, source?.ttsText, source?.questionAudioUrl]);

  // 다음 발화 재생을 미리 준비한다 — 합성분은 미리 합성하고, 질문 음원은 미리 열어 이어 재생 공백을 없앤다.
  // 음성이 없으면 재생 자체가 타이머 폴백이라 아무것도 준비하지 않는다
  const prefetch = (nextSource: SpeechSource) => {
    if (!voice) return;
    const { synthText, question } = resolveSpeechPlan(nextSource);
    void tts.prefetch(synthText, voice);
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
    // 오프닝은 음원을 그대로 다시 튼다 — 합성을 미리 시켜 봐야 안 쓰인다.
    // 그 외엔 합성분은 방금 튼 게 캐시에 있어 요청이 안 나가고, 질문 음원만 미리 열려 맞장구 뒤 공백이 없어진다
    if (!resolveOpeningSrc()) prefetch(source);
    setReplaying(true);
    replayStopRef.current = startSpeech(source, stopReplay);
    return true;
  };

  // 오프닝을 지나갔다는 표시 — 다음 질문이 화면에 올라갈 때 부른다
  const markOpeningPlayed = () => {
    isOpeningRef.current = false;
  };

  return { markOpeningPlayed, prefetch, speech, replay, replaying };
};
