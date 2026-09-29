// 사진 보관함에서 사진을 고른다 — 카메라 없이 보관함만 열고, 웹이 바로 보낼 수 있게 줄인 JPEG base64로 돌려준다
import type { PhotoPickStatus, PickedPhoto } from '@landit/bridge';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { reportError } from '../monitoring/report';

// 장당 1.5MB 안으로 맞춰 3장을 합쳐도 웹이 보낼 수 있는 한도(4.5MB)에 들어가게 한다 (웹 재인코딩과 같은 기준).
// 첫 단계(긴 변 2048)면 화면 캡처 글자가 충분히 읽히고, 넘칠 때만 한 단계씩 줄인다
export const MAX_PHOTO_BYTES = 1_500_000;
const STEPS = [
  { edge: 2048, quality: 0.85 },
  { edge: 1600, quality: 0.75 },
  { edge: 1280, quality: 0.7 },
] as const;

type Step = (typeof STEPS)[number];

// base64 네 글자가 3바이트다
const bytesOf = (base64: string) => Math.floor((base64.length * 3) / 4);

// 긴 쪽만 한도에 맞춘다 — 다른 쪽은 비율대로 따라온다. 작은 사진은 키우지 않는다
const resizeFor = (
  { width, height }: ImagePicker.ImagePickerAsset,
  edge: number,
) => {
  if (Math.max(width, height) <= edge) return null;
  return width >= height ? { width: edge } : { height: edge };
};

const encode = async (asset: ImagePicker.ImagePickerAsset, step: Step) => {
  const context = ImageManipulator.manipulate(asset.uri);
  const size = resizeFor(asset, step.edge);
  if (size) context.resize(size);
  const image = await context.renderAsync();
  const { base64 } = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: step.quality,
    base64: true,
  });
  if (!base64) throw new Error('base64 없음');
  return base64;
};

// 장당 한도를 넘으면 해상도와 화질을 한 단계씩 낮춘다. 마지막 단계에서도 넘으면 웹의 합계 검사가 막는다
const toJpegBase64 = async (asset: ImagePicker.ImagePickerAsset) => {
  let base64 = await encode(asset, STEPS[0]);
  for (const step of STEPS.slice(1)) {
    if (bytesOf(base64) <= MAX_PHOTO_BYTES) break;
    base64 = await encode(asset, step);
  }
  return base64;
};

interface PickResult {
  status: PhotoPickStatus;
  photos: PickedPhoto[];
  failedCount: number;
  overflowed: boolean;
}

const nothing = (status: PhotoPickStatus): PickResult => ({
  status,
  photos: [],
  failedCount: 0,
  overflowed: false,
});

/**
 * 사진 보관함을 열어 최대 limit장을 고르게 한다.
 *
 * 못 구운 사진은 빼고 보낸다. 선택창을 못 열거나 한 장도 못 구우면 error다.
 * 뺀 장수와 넘침 여부를 함께 돌려줘 웹이 사용자에게 알리게 한다
 */
export const pickPhotos = async (limit: number): Promise<PickResult> => {
  let result: ImagePicker.ImagePickerResult;
  try {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: limit,
    });
  } catch (error) {
    // 회신 없이 끝나면 웹은 제한 시간까지 잠긴 채 기다린다 — 실패도 돌려준다
    reportError(error);
    return nothing('error');
  }
  if (result.canceled) return nothing('cancelled');

  const taken = result.assets.slice(0, limit);
  const photos: PickedPhoto[] = [];
  // 한 장씩 굽는다 — 큰 사진 여러 장을 한꺼번에 풀면 메모리가 한 번에 치솟는다
  for (const asset of taken) {
    try {
      photos.push({
        base64: await toJpegBase64(asset),
        mimeType: 'image/jpeg',
      });
    } catch (error) {
      reportError(error, { width: asset.width, height: asset.height });
    }
  }
  return {
    status: photos.length > 0 ? 'success' : 'error',
    photos,
    failedCount: taken.length - photos.length,
    overflowed: result.assets.length > limit,
  };
};
