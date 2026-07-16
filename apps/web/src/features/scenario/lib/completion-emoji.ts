// 카테고리 이름에 어울리는 완료 축하 이모지를 고른다 — 노토 애니메이션 GIF가 실제로 존재하는 코드만 쓴다
// (BE가 이모지를 주지 않아 프론트에서 하드코딩. 현재 카테고리는 기숙사·여행·수업 3종, 모르면 🥰 폴백)

interface CompletionEmoji {
  code: string; // fonts.gstatic notoemoji GIF 경로 조각
  emoji: string; // alt 텍스트
}

const FALLBACK: CompletionEmoji = { code: '1f970', emoji: '🥰' };

const EMOJI_BY_CATEGORY: Record<string, CompletionEmoji> = {
  기숙사: { code: '1f3e0', emoji: '🏠' },
  여행: { code: '1f6ec', emoji: '🛬' },
  수업: { code: '1f4da', emoji: '📚' },
};

export const completionEmoji = (categoryName: string): CompletionEmoji =>
  EMOJI_BY_CATEGORY[categoryName] ?? FALLBACK;
