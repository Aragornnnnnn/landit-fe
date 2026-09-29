// 사진 보관함에서 사진을 고른다 — 카메라 없이 보관함만 열고, 웹이 바로 보낼 수 있게 줄인 JPEG base64로 돌려준다
import type { PhotoPickStatus, PickedPhoto } from '@landit/bridge';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { reportError } from '../monitoring/report';

// 긴 변 2048이면 화면 캡처 글자가 충분히 읽히고, 3장을 합쳐도 서버 합계 제한(10MiB)에 한참 못 미친다 (웹 재인코딩과 같은 기준)
const MAX_EDGE = 2048;
const QUALITY = 0.85;

// 긴 쪽만 한도에 맞춘다 — 다른 쪽은 비율대로 따라온다. 작은 사진은 키우지 않는다
const resizeFor = ({ width, height }: ImagePicker.ImagePickerAsset) => {
  if (Math.max(width, height) <= MAX_EDGE) return null;
  return width >= height ? { width: MAX_EDGE } : { height: MAX_EDGE };
};

const toJpegBase64 = async (asset: ImagePicker.ImagePickerAsset) => {
  const context = ImageManipulator.manipulate(asset.uri);
  const size = resizeFor(asset);
  if (size) context.resize(size);
  const image = await context.renderAsync();
  const { base64 } = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: QUALITY,
    base64: true,
  });
  if (!base64) throw new Error('base64 없음');
  return base64;
};

/**
 * 사진 보관함을 열어 최대 limit장을 고르게 한다.
 *
 * 못 구운 사진은 빼고 보낸다. 선택창을 못 열거나 한 장도 못 구우면 error다.
 */
export const pickPhotos = async (
  limit: number,
): Promise<{ status: PhotoPickStatus; photos: PickedPhoto[] }> => {
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
    return { status: 'error', photos: [] };
  }
  if (result.canceled) return { status: 'cancelled', photos: [] };

  const photos: PickedPhoto[] = [];
  // 한 장씩 굽는다 — 큰 사진 여러 장을 한꺼번에 풀면 메모리가 한 번에 치솟는다
  for (const asset of result.assets.slice(0, limit)) {
    try {
      photos.push({
        base64: await toJpegBase64(asset),
        mimeType: 'image/jpeg',
      });
    } catch (error) {
      reportError(error, { width: asset.width, height: asset.height });
    }
  }
  return photos.length > 0
    ? { status: 'success', photos }
    : { status: 'error', photos: [] };
};
