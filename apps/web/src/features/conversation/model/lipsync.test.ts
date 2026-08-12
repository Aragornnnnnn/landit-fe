import { describe, expect, it } from 'vitest';

import {
  advanceMouth,
  closedMouth,
  loudnessAt,
  neutralLoudness,
  toLoudnessTrack,
  toVisemes,
  visemeAt,
} from './lipsync';

describe('toVisemes', () => {
  it('입술을 닫는 자음은 다문 모양이 된다', () => {
    // given / when / then — m·b·p·f·v는 입술이 붙거나 닿는다
    expect(toVisemes('mm')).toEqual(['closed']);
    expect(toVisemes('bb')).toEqual(['closed']);
  });

  it('모음 종류에 따라 오므리거나 벌린 모양이 된다', () => {
    // given / when / then
    expect(toVisemes('o')).toEqual(['round']);
    expect(toVisemes('i')).toEqual(['wide']);
    expect(toVisemes('a')).toEqual(['open']);
  });

  it('같은 모양이 연달아 나오면 하나로 합친다', () => {
    // given — 같은 모양을 두 번 잡아두면 그 구간만 입이 굳는다
    // when
    const visemes = toVisemes('aa');

    // then
    expect(visemes).toEqual(['open']);
  });

  it('모양이 없는 글자는 직전 모양을 이어간다', () => {
    // given — r·s·t 같은 자음은 앞 모양에서 크게 벗어나지 않는다
    // when
    const visemes = toVisemes('art');

    // then
    expect(visemes).toEqual(['open']);
  });

  it('띄어쓰기와 문장부호에서는 입을 닫는다', () => {
    // given — 쉬는 자리에 입이 벌어져 있으면 멍한 얼굴이 된다
    // when
    const visemes = toVisemes('a i');

    // then
    expect(visemes).toEqual(['open', 'closed', 'wide']);
  });

  it('만들 모양이 하나도 없으면 벌린 모양 하나로 둔다', () => {
    // given — 빈 타임라인이면 아래에서 인덱스를 잡을 수 없다
    // when
    const visemes = toVisemes('');

    // then
    expect(visemes).toEqual(['open']);
  });
});

describe('visemeAt', () => {
  const visemes = toVisemes('a o i'); // open, closed, round, closed, wide

  it('진행도에 비례해 모양을 차례로 지난다', () => {
    // given — 글자별 시각이 없으므로 재생 길이에 균등 배분한다
    // when / then
    expect(visemeAt(visemes, 0)).toBe('open');
    expect(visemeAt(visemes, 0.99)).toBe('wide');
  });

  it('진행도가 범위를 벗어나도 양 끝 모양으로 잡아준다', () => {
    // given — duration이 아직 NaN이거나 재생이 끝을 넘긴 순간
    // when / then
    expect(visemeAt(visemes, -1)).toBe('open');
    expect(visemeAt(visemes, 2)).toBe('wide');
  });
});

describe('toLoudnessTrack', () => {
  // 1초에 100 샘플이면 10ms 구간이 정확히 1샘플이라 구간 경계를 눈으로 따라갈 수 있다
  const sampleRate = 100;

  it('파형을 10ms 구간별 음량으로 요약한다', () => {
    // given — 조용한 구간과 큰 구간이 번갈아 오는 파형
    const samples = new Float32Array([0, 0.5, 0, 1]);

    // when
    const track = toLoudnessTrack(samples, sampleRate);

    // then
    expect(Array.from(track)).toEqual([0, 0.5, 0, 1]);
  });

  it('한 구간에 여러 샘플이 들어가면 제곱평균으로 묶는다', () => {
    // given — 10ms에 2샘플이 들어가는 파형. +1과 -1은 부호만 다르고 크기는 같다
    const samples = new Float32Array([1, -1]);

    // when
    const track = toLoudnessTrack(samples, sampleRate * 2);

    // then
    expect(Array.from(track)).toEqual([1]);
  });

  it('빈 파형이면 표를 만들지 않는다', () => {
    // given / when
    const track = toLoudnessTrack(new Float32Array(), sampleRate);

    // then
    expect(track).toHaveLength(0);
  });
});

describe('loudnessAt', () => {
  const track = new Float32Array([0.1, 0.9]);

  it('진행도에 해당하는 구간의 음량을 돌려준다', () => {
    // given / when / then
    expect(loudnessAt(track, 0)).toBeCloseTo(0.1);
    expect(loudnessAt(track, 0.99)).toBeCloseTo(0.9);
  });

  it('진행도가 범위를 벗어나도 양 끝으로 잡아준다', () => {
    // given / when / then
    expect(loudnessAt(track, -1)).toBeCloseTo(0.1);
    expect(loudnessAt(track, 2)).toBeCloseTo(0.9);
  });

  it('표가 아직 없으면 평균치로 둔다', () => {
    // given — 디코딩 전이거나 실패한 경우. 입이 닫히면 말하는데 다문 얼굴이 된다
    // when / then
    expect(loudnessAt(null, 0.5)).toBe(neutralLoudness);
    expect(loudnessAt(new Float32Array(), 0.5)).toBe(neutralLoudness);
  });
});

describe('advanceMouth', () => {
  // 프레임을 여러 번 돌려 그 진행도에서 입이 안정된 값을 본다
  const settle = (
    visemes: ReturnType<typeof toVisemes>,
    track: Float32Array | null,
    progress: number,
  ) => {
    let mouth = closedMouth;
    for (let frame = 0; frame < 30; frame++) {
      mouth = advanceMouth(mouth, visemes, track, progress);
    }
    return mouth;
  };

  it('재생이 흐르면 입모양이 실제로 달라진다', () => {
    // given — 오므림(o)과 벌림(a)이 번갈아 오는 문장
    const visemes = toVisemes('oa');

    // when — 앞부분과 뒷부분
    const first = settle(visemes, null, 0);
    const last = settle(visemes, null, 0.99);

    // then — 오므린 입이 벌린 입보다 좁다
    expect(first.sx).toBeLessThan(last.sx);
  });

  it('소리가 클수록 크게 벌어진다', () => {
    // given — 같은 입모양을 조용한 구간과 큰 구간에서 본다
    const visemes = toVisemes('a');

    // when
    const quiet = settle(visemes, new Float32Array([0]), 0);
    const loud = settle(visemes, new Float32Array([0.5]), 0);

    // then
    expect(loud.sy).toBeGreaterThan(quiet.sy);
  });

  it('다문 구간은 소리가 커도 벌어지지 않는다', () => {
    // given — 입술이 붙는 자음(m)은 음량과 무관하다
    const visemes = toVisemes('m');

    // when
    const quiet = settle(visemes, new Float32Array([0]), 0);
    const loud = settle(visemes, new Float32Array([0.9]), 0);

    // then
    expect(loud.sy).toBeCloseTo(quiet.sy);
  });

  it('한 프레임에 목표까지 가지 않고 따라붙는다', () => {
    // given — 곧장 튀면 입모양이 바뀔 때마다 팝 하고 끊긴다
    const visemes = toVisemes('a');

    // when — 다문 입에서 한 프레임만 진행
    const next = advanceMouth(closedMouth, visemes, null, 0);

    // then — 움직이긴 했지만 목표(sy 1 언저리)에는 못 미친다
    expect(next.sy).toBeGreaterThan(closedMouth.sy);
    expect(next.sy).toBeLessThan(0.8);
  });
});
