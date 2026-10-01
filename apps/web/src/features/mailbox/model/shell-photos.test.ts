// 사진을 어디서 고를지 — 브라우저는 파일 입력, 새 셸은 사진 보관함 브릿지, 구 셸은 막는다
import { describe, expect, it } from 'vitest';

import {
  PHOTO_BRIDGE_VERSION,
  resolvePhotoSource,
  toPickedFile,
} from './shell-photos';

const shell = (bridgeVersion: number) => ({
  platform: 'ios' as const,
  appVersion: '1.3.2',
  buildNumber: '11',
  bridgeVersion,
});

describe('resolvePhotoSource', () => {
  it('일반 브라우저면 파일 입력을 쓴다', () => {
    expect(resolvePhotoSource(null)).toBe('file-input');
  });

  it('사진 고르기를 아는 셸이면 브릿지를 쓴다', () => {
    expect(resolvePhotoSource(shell(PHOTO_BRIDGE_VERSION))).toBe('shell');
  });

  it('구 셸이면 쓰지 않는다 — 파일 입력의 사진 찍기가 앱을 끌 수 있다', () => {
    expect(resolvePhotoSource(shell(PHOTO_BRIDGE_VERSION - 1))).toBe(
      'unavailable',
    );
  });
});

describe('toPickedFile', () => {
  it('셸이 준 base64를 JPEG 파일로 되돌린다', async () => {
    const file = toPickedFile(
      { base64: btoa('jpeg'), mimeType: 'image/jpeg' },
      0,
    );

    expect(file.type).toBe('image/jpeg');
    expect(file.name).toBe('photo-1.jpg');
    expect(await file.text()).toBe('jpeg');
  });
});
