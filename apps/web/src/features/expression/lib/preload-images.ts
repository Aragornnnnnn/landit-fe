// 예문(practice) 응답에서 preload할 이미지 URL을 모은다 — null 제외·중복 제거
import type { ExpressionPractice } from '../api/practice';

export const collectPreloadImageUrls = (
  practice: ExpressionPractice | null,
): string[] => {
  if (!practice) return [];
  const urls = practice.practiceSentence
    .map((sentence) => sentence.imageUrl)
    .filter((url): url is string => url !== null);
  return [...new Set(urls)];
};
