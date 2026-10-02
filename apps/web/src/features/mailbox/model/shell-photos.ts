'use client';

// 피드백 첨부 사진을 어디서 고를지와 셸 사진 보관함 왕복 — 앱 안에선 카메라 없이 보관함만 연다
import type { NativeContext, PickedPhoto } from '@landit/bridge';

import { requestFromNative } from '@/shared/bridge/request';

/** PICK_PHOTOS ↔ PHOTOS_PICKED를 알아듣는 최소 브릿지 계약 버전 */
export const PHOTO_BRIDGE_VERSION = 7;

// 사용자가 보관함을 오래 뒤적일 수 있다 — 결제 시트와 같은 넉넉한 한도
const PICK_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * 사진을 고를 방법.
 * 구 셸은 파일 입력을 쓰면 OS가 "사진 찍기"를 함께 띄우는데, 카메라 권한 문구가 없어 누르면 앱이 꺼질 수 있어 막는다
 */
export type PhotoSource = 'file-input' | 'shell' | 'unavailable';

export const resolvePhotoSource = (
  context: NativeContext | null,
): PhotoSource => {
  if (!context) return 'file-input';
  if (context.bridgeVersion < PHOTO_BRIDGE_VERSION) return 'unavailable';
  return 'shell';
};

/**
 * 셸의 사진 보관함을 열어 최대 limit장을 받는다.
 *
 * @param signal 화면이 사라질 때 끊는 용도. 끊기거나 시간이 지나면 null
 */
export const pickPhotosViaBridge = (limit: number, signal?: AbortSignal) =>
  requestFromNative({
    request: { type: 'PICK_PHOTOS', limit },
    replyType: 'PHOTOS_PICKED',
    timeoutMs: PICK_TIMEOUT_MS,
    signal,
  });

/** 셸이 구워 보낸 base64를 전송할 파일로 되돌린다. 셸이 이미 줄인 JPEG라 다시 굽지 않는다 */
export const toPickedFile = (photo: PickedPhoto, index: number) => {
  const binary = atob(photo.base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new File([bytes], `photo-${index + 1}.jpg`, { type: photo.mimeType });
};
