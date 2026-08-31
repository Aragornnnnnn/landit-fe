// 오디오 재생 배선 훅 — 새 재생이 이전 재생을 멈추고,
// 지금 뭐가 재생 중인지(playingId)를 노출해 듣기 버튼들이 같은 문법으로 상태를 그린다
import { useEffect, useRef, useState } from 'react';

/**
 * 오디오 재생 훅 — 새 재생이 이전 재생을 멈추고 재생은 한 번에 하나다.
 *
 * @returns play(src, {id, onDone}) · toggle(같은 id면 끄기) · stop ·
 *   playingId(지금 나오는 소리의 id) · progress(0~1, 카라오케 하이라이트용)
 */
export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRafRef = useRef(0);
  // 토글 판정용 미러 — 이벤트 핸들러에서 렌더 시점 state 대신 항상 현재 값을 본다
  const playingIdRef = useRef<string | null>(null);
  const finishRef = useRef<((reason?: 'ended' | 'stopped') => void) | null>(
    null,
  );
  // 재생 중인 소리의 식별자 — 같은 파일의 다른 구간(단어별)도 구분하도록 id를 따로 받는다
  const [playingId, setPlayingId] = useState<string | null>(null);
  // 재생 진행률 0~1 — 글자 하이라이트(카라오케)가 따라간다. 끝나면 0으로 돌아간다
  const [progress, setProgress] = useState(0);

  // 언마운트 시 재생 중이던 소리를 멈춘다
  useEffect(
    () => () => {
      audioRef.current?.pause();
      cancelAnimationFrame(progressRafRef.current);
    },
    [],
  );

  const play = (
    src: string,
    options?: {
      id?: string;
      // 재생이 끝나면 부른다 — 순차 재생·듣기 게이트 해제용.
      // reason: ended=끝까지 재생(자동재생 차단 포함), stopped=사용자가 꺼서 중단 (이때 예약된 다음 재생은 잇지 않는다)
      onDone?: (reason: 'ended' | 'stopped') => void;
    },
  ) => {
    audioRef.current?.pause();
    cancelAnimationFrame(progressRafRef.current);
    const audio = new Audio(src);
    audioRef.current = audio;
    const id = options?.id ?? src;

    let finished = false;
    const finish = (reason: 'ended' | 'stopped' = 'ended') => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(progressRafRef.current);
      setProgress(0);
      if (playingIdRef.current === id) playingIdRef.current = null;
      // 다른 재생이 이미 자리를 차지했으면 건드리지 않는다
      setPlayingId((current) => (current === id ? null : current));
      options?.onDone?.(reason);
    };
    finishRef.current = finish;

    // 실제 오디오 진행률로 하이라이트를 굴린다 (온보딩 사운드 스텝과 같은 방식)
    const trackProgress = () => {
      if (finished) return;
      if (audio.duration > 0) {
        setProgress(Math.min(audio.currentTime / audio.duration, 1));
      }
      progressRafRef.current = requestAnimationFrame(trackProgress);
    };

    audio.onended = () => finish('ended');
    playingIdRef.current = id;
    setPlayingId(id);
    setProgress(0);
    progressRafRef.current = requestAnimationFrame(trackProgress);
    // 재생 실패(자동재생 차단 등)에도 finish를 부른다 — 듣기 게이트가 영영 잠기지 않게.
    // jsdom은 play()가 프라미스를 돌려주지 않아 옵셔널 체이닝으로 감싼다
    void audio.play()?.catch(() => finish('ended'));
  };

  // 지금 나오는 소리를 멈춘다 — 진행 상태를 정리하고, 예약된 다음 재생은 잇지 않는다(stopped)
  const stop = () => {
    audioRef.current?.pause();
    finishRef.current?.('stopped');
  };

  // 듣기 버튼용 토글 — 같은 소리가 나오는 중이면 끄고, 아니면 새로 튼다
  const toggle = (src: string, options?: Parameters<typeof play>[1]) => {
    if (playingIdRef.current === (options?.id ?? src)) stop();
    else play(src, options);
  };

  return { play, toggle, stop, playingId, progress };
};
