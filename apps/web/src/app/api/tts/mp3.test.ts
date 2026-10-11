// 이어 붙은 MP3 스트림 합치기 — 첫 정보 프레임을 전체 기준으로 고치고 나머지 정보 프레임은 걷어 낸다
import { describe, expect, it } from 'vitest';

import { mergeConcatenatedMp3 } from './mp3';

// MPEG-2 Layer III·64kbps·24kHz·모노 프레임 — 길이 72*64000/24000 = 192바이트, 사이드 인포 9바이트
const FRAME_LENGTH = 192;
const TAG_OFFSET = 4 + 9;
// 프레임 수·바이트 수·탐색표(TOC) 플래그
const FLAGS = 0b111;

const audioFrame = (fill: number) => {
  const frame = new Uint8Array(FRAME_LENGTH).fill(fill);
  frame.set([0xff, 0xf3, 0x84, 0xc0]);
  return frame;
};

// 한 스트림 몫의 프레임 수·바이트 수만 적힌 정보 프레임 — 인코더가 문장마다 이렇게 붙인다
const infoFrame = (tag: 'Xing' | 'Info') => {
  const frame = audioFrame(0);
  frame.set(new TextEncoder().encode(tag), TAG_OFFSET);
  const view = new DataView(frame.buffer);
  view.setUint32(TAG_OFFSET + 4, FLAGS);
  view.setUint32(TAG_OFFSET + 8, 1);
  view.setUint32(TAG_OFFSET + 12, FRAME_LENGTH * 2);
  return frame;
};

const concat = (...frames: Uint8Array[]) => {
  const out = new Uint8Array(frames.reduce((sum, f) => sum + f.length, 0));
  let offset = 0;
  for (const frame of frames) {
    out.set(frame, offset);
    offset += frame.length;
  }
  return out;
};

const readInfo = (bytes: Uint8Array, frameAt: number) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset);
  const tagAt = frameAt + TAG_OFFSET;
  return {
    frames: view.getUint32(tagAt + 8),
    bytes: view.getUint32(tagAt + 12),
    toc: Array.from(bytes.subarray(tagAt + 16, tagAt + 116)),
  };
};

describe('mergeConcatenatedMp3', () => {
  it('문장별로 이어 붙은 스트림이면 뒤 정보 프레임을 걷어 내고 소리 프레임만 이어 둔다', () => {
    // given — Kokoro처럼 문장마다 정보 프레임이 붙은 스트림 두 개
    const bytes = concat(
      infoFrame('Xing'),
      audioFrame(1),
      infoFrame('Info'),
      audioFrame(2),
    );

    // when
    const result = mergeConcatenatedMp3(bytes);

    // then
    expect(result.length).toBe(FRAME_LENGTH * 3);
    expect(result.subarray(FRAME_LENGTH)).toEqual(
      concat(audioFrame(1), audioFrame(2)),
    );
  });

  it('첫 정보 프레임의 프레임 수·바이트 수를 전체 기준으로 고친다', () => {
    // given
    const bytes = concat(
      infoFrame('Xing'),
      audioFrame(1),
      infoFrame('Xing'),
      audioFrame(2),
    );

    // when
    const result = mergeConcatenatedMp3(bytes);

    // then — 프레임 수는 정보 프레임을 뺀 소리 프레임만, 바이트 수는 정보 프레임까지 센다
    const info = readInfo(result, 0);
    expect(info.frames).toBe(2);
    expect(info.bytes).toBe(FRAME_LENGTH * 3);
  });

  it('탐색표는 전체 길이의 몇 % 지점이 몇 번째 바이트쯤인지를 256 단위로 다시 적는다', () => {
    // given
    const bytes = concat(
      infoFrame('Xing'),
      audioFrame(1),
      infoFrame('Xing'),
      audioFrame(2),
    );

    // when
    const result = mergeConcatenatedMp3(bytes);

    // then — 0~49%는 첫 소리 프레임(192바이트), 50~99%는 둘째 소리 프레임(384바이트) 위치
    const { toc } = readInfo(result, 0);
    expect(toc[0]).toBe(Math.floor((192 * 256) / 576));
    expect(toc[49]).toBe(Math.floor((192 * 256) / 576));
    expect(toc[50]).toBe(Math.floor((384 * 256) / 576));
    expect(toc[99]).toBe(Math.floor((384 * 256) / 576));
  });

  it('스트림이 하나면 길이 정보가 맞으니 그대로 둔다', () => {
    // given
    const bytes = concat(infoFrame('Xing'), audioFrame(1), audioFrame(2));

    // when
    const result = mergeConcatenatedMp3(bytes);

    // then
    expect(result).toBe(bytes);
  });

  it('앞에 ID3 태그가 있으면 태그는 남기고 그 뒤 프레임부터 본다', () => {
    // given — ID3 헤더 10바이트 + 본문 5바이트(synchsafe 크기)
    const id3 = new Uint8Array([
      0x49, 0x44, 0x33, 4, 0, 0, 0, 0, 0, 5, 1, 2, 3, 4, 5,
    ]);
    const bytes = concat(
      id3,
      infoFrame('Xing'),
      audioFrame(1),
      infoFrame('Xing'),
      audioFrame(2),
    );

    // when
    const result = mergeConcatenatedMp3(bytes);

    // then
    expect(result.subarray(0, id3.length)).toEqual(id3);
    expect(readInfo(result, id3.length).frames).toBe(2);
    expect(result.length).toBe(id3.length + FRAME_LENGTH * 3);
  });

  it('마지막 프레임이 잘려 있으면 길이를 잘못 적지 않게 원본을 돌려준다', () => {
    // given — 업스트림 본문이 프레임 중간에서 끊긴 경우
    const whole = concat(
      infoFrame('Xing'),
      audioFrame(1),
      infoFrame('Xing'),
      audioFrame(2),
    );
    const bytes = whole.slice(0, whole.length - 10);

    // when
    const result = mergeConcatenatedMp3(bytes);

    // then
    expect(result).toBe(bytes);
  });

  it('첫 정보 프레임이 고쳐 쓸 필드보다 짧으면 뒤 프레임을 덮지 않게 원본을 돌려준다', () => {
    // given — 8kbps 첫 프레임(72*8000/24000 = 24바이트)에 정보 태그가 들어 있다
    const tiny = new Uint8Array(24);
    tiny.set([0xff, 0xf3, 0x14, 0xc0]);
    tiny.set(new TextEncoder().encode('Xing'), TAG_OFFSET);
    tiny.set([0, 0, 0, FLAGS], TAG_OFFSET + 4);
    const bytes = concat(tiny, audioFrame(1), infoFrame('Xing'), audioFrame(2));

    // when
    const result = mergeConcatenatedMp3(bytes);

    // then
    expect(result).toBe(bytes);
  });

  it('프레임 헤더가 깨져 있으면 손대지 않고 원본을 돌려준다', () => {
    // given
    const bytes = concat(
      infoFrame('Xing'),
      new Uint8Array([1, 2, 3]),
      infoFrame('Xing'),
    );

    // when
    const result = mergeConcatenatedMp3(bytes);

    // then
    expect(result).toBe(bytes);
  });
});
