'use client';

// 마이페이지 "음성" 행 — 눌러 들어간 시트에서 영어 음성이 들리는 속도를 고른다. 값은 이 기기의 localStorage에만 산다
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { EVENTS } from '@landit/analytics';

import { soundAudioSrc } from '@/features/onboarding/model/sound-check';
import { track } from '@/shared/analytics';
import {
  DEFAULT_SPEECH_RATE,
  getSpeechRate,
  setSpeechRate,
  SPEECH_RATES,
  subscribeSpeechRate,
  type SpeechRate,
} from '@/shared/lib/speech-rate';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';

import { MenuButton } from './Menu';

// 0.5는 "0.5x", 1은 "1x" — 소수점 뒤 0은 붙이지 않는다
const rateLabel = (rate: SpeechRate) => `${rate}x`;

// 미리듣기 음원은 온보딩 사운드 확인에 쓰는 것을 그대로 빌려 쓴다.
// 배속을 견주는 게 목적이라 문장은 늘 같아야 해서 인덱스를 고정한다 (로테이션 안 씀)
const PREVIEW_SRC = soundAudioSrc(0);

export const SpeechRateMenuEntry = () => {
  const [open, setOpen] = useState(false);
  // 서버 렌더에서는 기본 배속으로 두고, 클라이언트에서 저장값을 읽는다
  const rate = useSyncExternalStore(
    subscribeSpeechRate,
    getSpeechRate,
    () => DEFAULT_SPEECH_RATE,
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const stopPreview = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(false);
  };

  // 닫기를 거치지 않고 사라질 때(라우트 이동·인증 가드)도 소리를 남기지 않는다 — useAudioPlayer와 같은 뒷정리
  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  const choose = (next: SpeechRate) => {
    // 이미 고른 칸을 다시 눌러도 role="radio" 버튼은 클릭이 들어온다 — 바뀐 게 없으면 저장도 계측도 하지 않는다
    if (next === getSpeechRate()) return;
    setSpeechRate(next);
    // 듣는 중에 바꾸면 그 소리부터 바로 바뀐다 — 멈췄다 다시 틀게 하지 않는다
    if (audioRef.current) audioRef.current.playbackRate = next;
    track(EVENTS.SPEECH_RATE_CHANGED, { rate: next });
  };

  // 문장은 보여주지 않는다 — 고른 속도가 어떤지 듣는 자리라 글자는 시선만 가져간다
  const togglePreview = () => {
    if (playing) {
      stopPreview();
      return;
    }
    const audio = new Audio(PREVIEW_SRC);
    // 렌더 클로저의 rate가 아니라 저장소를 직접 읽는다 — 방금 고른 값이 아직 렌더에 반영되기 전일 수 있다
    audio.playbackRate = getSpeechRate();
    audio.onended = stopPreview;
    audio.onerror = stopPreview;
    audioRef.current = audio;
    setPlaying(true);
    // jsdom은 play()가 프라미스를 돌려주지 않아 옵셔널 체이닝으로 감싼다
    void audio.play()?.catch(stopPreview);
  };

  const close = () => {
    stopPreview();
    setOpen(false);
  };

  return (
    <>
      <MenuButton
        title="음성"
        icon={<Emoji>🔊</Emoji>}
        onClick={() => setOpen(true)}
      />

      <BottomSheet open={open} onClose={close}>
        {/* 들어보기는 헤더 우측 보조 동작 — 본문 세로 흐름(세그먼트·축 라벨·닫기)에 버튼을 하나 더 쌓지 않는다 */}
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold" style={{ color: '#111' }}>
            음성
          </h2>
          <button
            type="button"
            onClick={togglePreview}
            // 들어보기↔멈추기로 글자 수가 달라도 pill 크기는 그대로 — 눌렀다고 버튼이 줄어들면 흔들려 보인다
            className="flex min-w-[88px] items-center justify-center gap-1.5 rounded-full py-1.5 pr-3 pl-2.5 text-[12.5px] font-medium active:opacity-70"
            style={{ background: '#F2F2F7', color: '#111' }}
          >
            <span className="text-[9px]" aria-hidden>
              {playing ? '■' : '▶'}
            </span>
            {playing ? '멈추기' : '들어보기'}
          </button>
        </div>
        <p className="mt-1 text-[14px] leading-6" style={{ color: '#666' }}>
          영어 음성이 들리는 속도예요
        </p>

        <div
          role="radiogroup"
          aria-label="말하기 속도"
          className="mt-5 flex gap-0 rounded-[10px] p-1"
          style={{ background: '#F2F2F7' }}
        >
          {SPEECH_RATES.map((option) => {
            const selected = option === rate;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${option}배`}
                onClick={() => choose(option)}
                className={`flex-1 rounded-lg py-[9px] text-[13px] transition-colors ${
                  selected ? 'bg-white font-bold shadow-sm' : 'font-medium'
                }`}
                style={{ color: selected ? '#111' : '#6B7280' }}
              >
                {rateLabel(option)}
              </button>
            );
          })}
        </div>

        {/* 숫자가 주인공이고 거북이·토끼는 양 끝이 어느 쪽인지만 알려준다 */}
        <div
          className="mt-2 flex justify-between px-1 text-[12px]"
          style={{ color: '#9CA3AF' }}
        >
          <span>
            <Emoji>🐢</Emoji> 느리게
          </span>
          <span>
            빠르게 <Emoji>🐇</Emoji>
          </span>
        </div>

        <div className="mt-5">
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="w-full"
            onClick={close}
          >
            닫기
          </Button>
        </div>
      </BottomSheet>
    </>
  );
};
