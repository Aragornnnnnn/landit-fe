// 문장별로 이어 붙은 MP3 스트림을 길이 정보가 맞는 한 스트림으로 합치는 유틸
const BITRATES_KBPS = {
  mpeg1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  mpeg2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};
const SAMPLE_RATES = {
  mpeg1: [44100, 48000, 32000],
  mpeg2: [22050, 24000, 16000],
  mpeg25: [11025, 12000, 8000],
};
// 정보 프레임(Xing·Info) 플래그 — 켜진 필드만 이 순서로 적힌다
const HAS_FRAMES = 1;
const HAS_BYTES = 2;
const HAS_TOC = 4;

interface Frame {
  at: number;
  length: number;
  // 정보 프레임이면 태그 위치, 소리 프레임이면 null
  infoTagAt: number | null;
}

// Layer III 프레임 헤더를 읽어 길이와 정보 프레임 여부를 낸다. 헤더가 아니면 null
const readFrame = (bytes: Uint8Array, at: number): Frame | null => {
  if (at + 4 > bytes.length) return null;
  if (bytes[at] !== 0xff || (bytes[at + 1] & 0xe0) !== 0xe0) return null;
  const versionBits = (bytes[at + 1] >> 3) & 0b11;
  const layerBits = (bytes[at + 1] >> 1) & 0b11;
  if (versionBits === 0b01 || layerBits !== 0b01) return null;

  const isMpeg1 = versionBits === 0b11;
  const bitrate =
    BITRATES_KBPS[isMpeg1 ? 'mpeg1' : 'mpeg2'][bytes[at + 2] >> 4] * 1000;
  const sampleRate = (
    isMpeg1
      ? SAMPLE_RATES.mpeg1
      : versionBits === 0b10
        ? SAMPLE_RATES.mpeg2
        : SAMPLE_RATES.mpeg25
  )[(bytes[at + 2] >> 2) & 0b11];
  if (!bitrate || !sampleRate) return null;

  const padding = (bytes[at + 2] >> 1) & 1;
  const length =
    Math.floor(((isMpeg1 ? 144 : 72) * bitrate) / sampleRate) + padding;
  const mono = bytes[at + 3] >> 6 === 0b11;
  const tagAt = at + 4 + (isMpeg1 ? (mono ? 17 : 32) : mono ? 9 : 17);
  const tag = String.fromCharCode(...bytes.subarray(tagAt, tagAt + 4));
  return {
    at,
    length,
    infoTagAt: tag === 'Xing' || tag === 'Info' ? tagAt : null,
  };
};

// ID3v2 태그 길이 — 크기는 7비트씩 끊어 적는다(synchsafe)
const id3Length = (bytes: Uint8Array) =>
  bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33
    ? 10 + ((bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9])
    : 0;

/**
 * 문장마다 따로 인코딩해 이어 붙인 MP3(Kokoro)는 스트림마다 정보 프레임이 있고, 첫 정보 프레임엔 첫 문장 몫만 적힌다.
 * 브라우저가 그 값을 믿으면 duration이 짧게 나오거나 첫 문장에서 재생이 끝난다.
 * VBR이라 정보 프레임을 다 빼면 길이 추정이 크게 틀리므로, 첫 정보 프레임을 전체 기준(프레임 수·바이트 수·탐색표)으로 고치고 나머지만 걷어 낸다.
 * 정보 프레임이 하나뿐이거나, 프레임을 못 읽거나, 끝이 잘렸거나, 고쳐 쓸 자리가 모자라면 원본을 그대로 돌려준다.
 */
export const mergeConcatenatedMp3 = (
  bytes: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> => {
  const start = id3Length(bytes);
  const frames: Frame[] = [];
  for (let at = start; at < bytes.length;) {
    const frame = readFrame(bytes, at);
    // 헤더가 아니거나 본문이 프레임 중간에서 끊겼으면 길이를 잘못 적게 되니 손대지 않는다
    if (!frame || at + frame.length > bytes.length) return bytes;
    frames.push(frame);
    at += frame.length;
  }
  const [head, ...rest] = frames;
  if (head?.infoTagAt == null || !rest.some((f) => f.infoTagAt !== null)) {
    return bytes;
  }

  const audio = rest.filter((frame) => frame.infoTagAt === null);
  // 고쳐 쓸 필드(태그·플래그 8바이트 뒤로 켜진 필드만)가 첫 프레임 안에 들어가야 뒤 프레임을 덮지 않는다
  const flags = new DataView(bytes.buffer, bytes.byteOffset).getUint32(
    head.infoTagAt + 4,
  );
  const fieldsEnd =
    head.infoTagAt +
    8 +
    (flags & HAS_FRAMES ? 4 : 0) +
    (flags & HAS_BYTES ? 4 : 0) +
    (flags & HAS_TOC ? 100 : 0);
  if (audio.length === 0 || fieldsEnd > head.at + head.length) return bytes;
  const total =
    head.length + audio.reduce((sum, frame) => sum + frame.length, 0);
  const out = new Uint8Array(start + total);
  out.set(bytes.subarray(0, start + head.length));
  // 소리 프레임마다 정보 프레임 시작점 기준 위치 — 탐색표가 쓴다
  const offsets: number[] = [];
  let offset = start + head.length;
  for (const frame of audio) {
    offsets.push(offset - start);
    out.set(bytes.subarray(frame.at, frame.at + frame.length), offset);
    offset += frame.length;
  }

  const view = new DataView(out.buffer);
  let field = head.infoTagAt + 8;
  if (flags & HAS_FRAMES) {
    view.setUint32(field, audio.length);
    field += 4;
  }
  if (flags & HAS_BYTES) {
    view.setUint32(field, total);
    field += 4;
  }
  if (flags & HAS_TOC) {
    for (let i = 0; i < 100; i++) {
      const frameOffset = offsets[Math.floor((i * audio.length) / 100)];
      out[field + i] = Math.min(255, Math.floor((frameOffset * 256) / total));
    }
  }
  return out;
};
