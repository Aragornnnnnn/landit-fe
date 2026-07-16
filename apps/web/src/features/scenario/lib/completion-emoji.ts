// 카테고리 이름에 어울리는 완료 축하 이모지를 고른다 — 노토 애니메이션 GIF가 실제로 존재하는 코드만 쓴다
// (BE가 이모지를 주지 않아 프론트에서 키워드로 매칭하고, 모르는 카테고리는 🥰로 폴백)

interface CompletionEmoji {
  code: string; // fonts.gstatic notoemoji GIF 경로 조각
  emoji: string; // alt 텍스트
}

const FALLBACK: CompletionEmoji = { code: '1f970', emoji: '🥰' };

// 키워드는 포함 매칭 — 위에서부터 먼저 걸리는 것이 이긴다
const EMOJI_BY_KEYWORD: [string, CompletionEmoji][] = [
  ['여행', { code: '1f6ec', emoji: '🛬' }],
  ['공항', { code: '1f6ec', emoji: '🛬' }],
  ['카페', { code: '2615', emoji: '☕' }],
  ['커피', { code: '2615', emoji: '☕' }],
  ['음식', { code: '1f35c', emoji: '🍜' }],
  ['식당', { code: '1f35c', emoji: '🍜' }],
  ['맛집', { code: '1f35c', emoji: '🍜' }],
  ['쇼핑', { code: '1f6d2', emoji: '🛒' }],
  ['일상', { code: '1f3e0', emoji: '🏠' }],
  ['학교', { code: '1f4da', emoji: '📚' }],
  ['공부', { code: '1f4da', emoji: '📚' }],
  ['문화', { code: '1f3ac', emoji: '🎬' }],
  ['영화', { code: '1f3ac', emoji: '🎬' }],
  ['교통', { code: '1f68c', emoji: '🚌' }],
  ['친구', { code: '1f973', emoji: '🥳' }],
  ['모임', { code: '1f973', emoji: '🥳' }],
];

export const completionEmoji = (categoryName: string): CompletionEmoji =>
  EMOJI_BY_KEYWORD.find(([keyword]) => categoryName.includes(keyword))?.[1] ??
  FALLBACK;
