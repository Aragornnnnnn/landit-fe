// 발음 녹음의 mimeType 선택과 업로드 파일명 결정 — BE가 파일명 확장자로 형식을 검증한다
// 후보 순서: webm 우선 — 크롬·안드로이드의 정석 출력이다. 최신 크롬은 audio/mp4도 지원하지만
// 그 결과물이 "opus를 mp4에 담은 m4a"라는 비표준 조합이라 디코더가 탈 수 있다.
// 사파리·iOS는 webm 미지원이라 mp4(AAC m4a)로 떨어진다
const MIME_CANDIDATES = ['audio/webm', 'audio/mp4', 'audio/ogg'];

/**
 * 브라우저가 지원하는 녹음 mimeType을 후보 순서대로 고른다.
 *
 * @param isSupported 보통 MediaRecorder.isTypeSupported를 그대로 넘긴다
 * @returns 지원 후보가 없으면 undefined — 브라우저 기본값에 맡긴다
 */
export const pickRecordingMimeType = (
  isSupported: (mimeType: string) => boolean,
): string | undefined => MIME_CANDIDATES.find((type) => isSupported(type));

// MediaRecorder가 실제로 쓴 mimeType(코덱 파라미터 포함) → 업로드 확장자
const EXTENSIONS: [string, string][] = [
  ['audio/mp4', 'm4a'],
  ['audio/webm', 'webm'],
  ['audio/ogg', 'ogg'],
  ['audio/wav', 'wav'],
  ['audio/mpeg', 'mp3'],
];

/** 실제 쓰인 mimeType으로 업로드 파일명을 짓는다 — BE가 확장자로 형식을 검증한다 */
export const recordingFilename = (mimeType: string): string => {
  const match = EXTENSIONS.find(([prefix]) => mimeType.startsWith(prefix));
  return `recording.${match ? match[1] : 'webm'}`;
};
