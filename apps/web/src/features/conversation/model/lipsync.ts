// 립싱크 규칙 — 입모양(무엇을)과 음량(얼마나)을 따로 만들어 재생 진행도로 함께 조회한다.
// 입모양은 쓰는 TTS(OpenRouter)가 글자별 시각을 주지 않아 철자로 근사해 소리가 나는 구간에 배분하고,
// 음량은 재생 전에 파형을 미리 요약해 둔다 — 재생 중 실시간 분석은 오디오를 WebAudio 그래프로
// 통과시켜야 해서, 그 경로가 막히면 소리 자체가 안 난다.

/** 입이 취하는 모양 — 아래 MOUTH_TARGETS가 모양마다 실제 배율을 정한다 */
export type VisemeShape = 'closed' | 'round' | 'wide' | 'open';

const shapeOfChar = (char: string): VisemeShape | null => {
  if ('mbpfv'.includes(char)) return 'closed'; // 입술이 붙거나 닿는다
  if ('ouw'.includes(char)) return 'round';
  if ('iey'.includes(char)) return 'wide';
  if ('ahjkgqcxz'.includes(char)) return 'open';
  // 쉬는 자리에 입이 벌어져 있으면 멍한 얼굴이 된다
  if (' ,.!?'.includes(char)) return 'closed';
  return null; // 나머지 자음은 직전 모양을 이어간다 — 매 글자 바꾸면 입이 떨린다
};

/** 문장을 입모양 순서로 바꾼다. 연속으로 같은 모양은 합쳐서 굳는 구간을 없앤다 */
export const toVisemes = (text: string): VisemeShape[] => {
  const visemes: VisemeShape[] = [];
  for (const char of text.toLowerCase()) {
    const shape = shapeOfChar(char);
    if (shape && shape !== visemes.at(-1)) visemes.push(shape);
  }
  return visemes.length ? visemes : ['open'];
};

/** 재생 진행도(0~1)에 해당하는 입모양 */
export const visemeAt = (
  visemes: VisemeShape[],
  progress: number,
): VisemeShape => visemes[indexAt(visemes.length, progress)];

// 입은 10ms마다 갱신할 만큼 빠르지 않다. 이보다 잘게 나눠도 표만 커진다
const loudnessStepMs = 10;

/** 표가 아직 없을 때 쓰는 보통 크기 — 말하는 중에 입이 닫히는 것보다 낫다 */
export const neutralLoudness = 0.15;

/** 파형을 구간별 음량(RMS)으로 요약한다 — 재생 중엔 이 표를 조회하기만 한다 */
export const toLoudnessTrack = (
  samples: Float32Array,
  sampleRate: number,
): Float32Array => {
  const perStep = Math.max(1, Math.round((sampleRate * loudnessStepMs) / 1000));
  const track = new Float32Array(Math.ceil(samples.length / perStep));
  for (let step = 0; step < track.length; step++) {
    const start = step * perStep;
    const end = Math.min(samples.length, start + perStep);
    let squareSum = 0;
    for (let i = start; i < end; i++) squareSum += samples[i] ** 2;
    // 제곱평균이라 부호가 엇갈려도 상쇄되지 않는다 (평균을 쓰면 진동이 0으로 지워진다)
    track[step] = Math.sqrt(squareSum / (end - start));
  }
  return track;
};

/** 진행도(0~1)에 해당하는 음량. 표가 없으면(디코딩 전·실패) 보통 크기로 흘려보낸다 */
export const loudnessAt = (
  track: Float32Array | null,
  progress: number,
): number =>
  track?.length ? track[indexAt(track.length, progress)] : neutralLoudness;

// duration이 아직 NaN이거나 재생이 끝을 넘긴 순간에도 양 끝으로 잡아준다
const indexAt = (length: number, progress: number) =>
  Math.min(length - 1, Math.max(0, Math.floor(progress * length)));

// 가장 큰 소리의 이 비율보다 작으면 쉬는 구간이다 — 목소리·음량마다 절대 크기가 달라 상대값으로 본다
const silenceRatio = 0.08;
// 이보다 짧은 끊김은 쉼이 아니다 — p·t 앞의 막힘까지 닫으면 입이 떨린다
const minPauseMs = 80;
const minPauseSteps = Math.ceil(minPauseMs / loudnessStepMs);

/**
 * 음량 표를 글자 진행 표로 바꾼다 — 글자는 소리가 나는 시간만큼만 나아가고, 쉬는 칸은 NaN이다.
 * 글자를 재생 시간에 고르게 나누면 쉼을 지날 때마다 입이 소리보다 앞서간다. 소리가 없으면 null이다
 */
export const toArticulationTrack = (
  track: Float32Array,
): Float32Array | null => {
  const peak = track.reduce((max, loud) => Math.max(max, loud), 0);
  if (peak === 0) return null;

  const silent = track.map((loud) => (loud < peak * silenceRatio ? 1 : 0));
  const paused = new Uint8Array(track.length);
  for (let start = 0; start < track.length; start++) {
    if (!silent[start]) continue;
    let end = start;
    while (end < track.length && silent[end]) end++;
    if (end - start >= minPauseSteps) paused.fill(1, start, end);
    start = end;
  }

  const voicedSteps = paused.reduce((count, flag) => count + (1 - flag), 0);
  if (voicedSteps === 0) return null;
  let voiced = 0;
  return track.map((_, step) => (paused[step] ? NaN : ++voiced / voicedSteps));
};

/**
 * 캐릭터가 transform으로 옮기기만 하면 되는 입 상태.
 * sx는 가로 너비, sy는 세로 벌림, dy는 벌어질수록 입이 아래로 내려가는 턱 성분(px)이다.
 */
export interface MouthState {
  sx: number;
  sy: number;
  dy: number;
}

// 입모양별 목표. amp는 그 모양이 음량을 얼마나 타는지다 — 다문 입은 소리가 커도 벌어지지 않는다
const MOUTH_TARGETS: Record<
  VisemeShape,
  { sx: number; sy: number; amp: number }
> = {
  open: { sx: 1, sy: 1, amp: 1 },
  round: { sx: 0.55, sy: 0.8, amp: 0.9 },
  wide: { sx: 1.15, sy: 0.4, amp: 0.6 },
  closed: { sx: 0.85, sy: 0.18, amp: 0 },
};

// 벌림에서 턱 내림을 끌어낸다 — 반쯤(0.4) 열린 지점을 기준으로 위아래로 벌어진다
const jawDrop = (open: number) => (open - 0.4) * 5;

/** 말하기 전 다문 입 — 립싱크는 여기서 출발해 첫 소리로 열린다 */
export const closedMouth: MouthState = {
  ...MOUTH_TARGETS.closed,
  dy: jawDrop(MOUTH_TARGETS.closed.sy),
};

/**
 * 한 프레임만큼 입을 목표 쪽으로 옮긴다.
 * 목표로 곧장 튀면 입모양이 바뀔 때마다 팝 하고 끊겨서, 매 프레임 일부만 따라붙는다.
 */
export const advanceMouth = (
  current: MouthState,
  visemes: VisemeShape[],
  track: Float32Array | null,
  progress: number,
  articulation: Float32Array | null = null,
): MouthState => {
  // 표가 없으면(디코딩 전·실패) 글자를 재생 시간에 고르게 나눈다
  const spoken = articulation?.length
    ? articulation[indexAt(articulation.length, progress)]
    : progress;
  const target = Number.isNaN(spoken)
    ? MOUTH_TARGETS.closed
    : MOUTH_TARGETS[visemeAt(visemes, spoken)];
  // 음량을 벌림 배율로 옮긴다 — 조용해도 완전히 닫히진 않게 바닥을 깔아둔다
  const amp = Math.min(1.2, 0.35 + loudnessAt(track, progress) * 4.5);
  const open = target.sy * (1 - target.amp) + target.sy * amp * target.amp;
  // 벌릴 땐 빠르게, 닫힐 땐 천천히 — 사람 입이 그렇게 움직인다
  const sy =
    current.sy + (open - current.sy) * (open > current.sy ? 0.55 : 0.3);

  return {
    sx: current.sx + (target.sx - current.sx) * 0.35,
    sy,
    dy: jawDrop(sy),
  };
};

// 디코딩 전용이라 하드웨어 오디오를 잡지 않는다 — 재생 중인 소리는 이 컨텍스트를 거치지 않는다.
// 음량 표가 10ms 간격이라 8kHz로 충분하고, decodeAudioData가 이 레이트로 리샘플해 준다
const decodeContext = () => new OfflineAudioContext(1, 1, 8000);

/** 재생할 오디오의 파형을 음량 표로 요약한다. 실패해도(디코딩 불가 등) 입모양은 그대로 움직인다 */
export const loadLoudnessTrack = async (
  source: string,
): Promise<Float32Array | null> => {
  try {
    const bytes = await fetch(source).then((res) => res.arrayBuffer());
    const buffer = await decodeContext().decodeAudioData(bytes);
    return toLoudnessTrack(buffer.getChannelData(0), buffer.sampleRate);
  } catch {
    return null;
  }
};
