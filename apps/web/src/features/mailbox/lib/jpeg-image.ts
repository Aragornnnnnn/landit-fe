// 첨부 사진을 서버가 받는 JPEG로 다시 굽는다 — HEIC·큰 PNG·용량 제한을 사용자가 모르게 한 번에 푼다
// 긴 변 2048이면 폰 화면 캡처 글자가 충분히 읽히고, 3장을 합쳐도 서버 합계 제한(10MiB)에 한참 못 미친다
const MAX_EDGE = 2048;
const QUALITY = 0.85;

/** 브라우저가 풀지 못한 사진 — 깨졌거나 이 기기가 모르는 형식이다 */
export class UnreadableImageError extends Error {
  constructor(cause: unknown) {
    super('첨부 사진을 읽을 수 없어요', { cause });
    this.name = 'UnreadableImageError';
  }
}

/** 긴 변이 max를 넘으면 비율을 지켜 줄인다. 작은 사진은 키우지 않는다 */
export const fitWithin = (width: number, height: number, max: number) => {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
};

/**
 * 사진을 JPEG 파일로 다시 굽는다.
 *
 * @throws UnreadableImageError 브라우저가 사진을 풀지 못하면
 */
export const toJpeg = async (file: File): Promise<File> => {
  const bitmap = await createImageBitmap(file).catch((error: unknown) => {
    throw new UnreadableImageError(error);
  });
  const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_EDGE);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  try {
    const context = canvas.getContext('2d');
    if (!context) throw new UnreadableImageError('canvas 2d 없음');
    // JPEG엔 투명이 없다 — 깔지 않으면 투명 PNG의 빈 곳이 검게 나온다
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
  } finally {
    bitmap.close();
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY),
  );
  // iOS는 캔버스 메모리를 GC 전까지 안 돌려준다 — 바로 비워 여러 장을 구워도 한도에 안 걸리게 한다
  canvas.width = 0;
  canvas.height = 0;
  if (!blob) throw new UnreadableImageError('JPEG 인코딩 실패');
  return new File([blob], `${file.name.replace(/\.[^.]*$/, '')}.jpg`, {
    type: 'image/jpeg',
  });
};
