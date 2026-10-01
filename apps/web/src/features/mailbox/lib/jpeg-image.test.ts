// 첨부 사진 재인코딩 — 긴 변을 줄이는 계산과 못 읽는 파일의 실패 신호
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fitWithin,
  MAX_PHOTO_BYTES,
  toJpeg,
  UnreadableImageError,
} from './jpeg-image';

describe('fitWithin', () => {
  it('긴 변이 한도 안이면 크기를 그대로 둔다', () => {
    expect(fitWithin(1200, 800, 2048)).toEqual({ width: 1200, height: 800 });
  });

  it('세로가 길면 세로를 한도에 맞추고 비율을 지킨다', () => {
    expect(fitWithin(1179, 2556, 2048)).toEqual({ width: 945, height: 2048 });
  });

  it('가로가 길면 가로를 한도에 맞추고 비율을 지킨다', () => {
    expect(fitWithin(4032, 3024, 2048)).toEqual({ width: 2048, height: 1536 });
  });
});

describe('toJpeg', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('브라우저가 이미지를 풀지 못하면 UnreadableImageError를 던진다', async () => {
    // given — 깨진 파일이나 지원하지 않는 형식
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockRejectedValue(new DOMException('decode failed')),
    );
    const file = new File(['not an image'], 'broken.heic');

    // when + then
    await expect(toJpeg(file)).rejects.toBeInstanceOf(UnreadableImageError);
  });

  it('장당 한도를 넘으면 해상도를 낮춰 한 번 더 굽는다', async () => {
    // given — 4032×3024 사진, 첫 굽기는 한도를 넘고 두 번째는 안에 든다
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue({ width: 4032, height: 3024, close: vi.fn() }),
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    const widths: number[] = [];
    const sizes = [MAX_PHOTO_BYTES + 1, 1000];
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      function (this: HTMLCanvasElement, callback) {
        widths.push(this.width);
        callback(new Blob([new Uint8Array(sizes[widths.length - 1])]));
      },
    );

    // when
    const file = await toJpeg(new File(['x'], 'shot.png'));

    // then — 긴 변 2048로 구웠다가 1600으로 다시 구운 것을 돌려준다
    expect(widths).toEqual([2048, 1600]);
    expect(file.size).toBe(1000);
    expect(file.name).toBe('shot.jpg');
  });
});
