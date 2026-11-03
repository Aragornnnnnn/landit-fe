// 캐릭터마다 깔리는 카드 바탕색 — 내 시나리오 카드와 만들기 로딩 카드가 같은 색을 쓴다
import type { Partner } from '@/features/conversation/model/character-look';

// 위는 옅게, 아래로 갈수록 캐릭터 대표색에 가깝게
export const PARTNER_TINT: Record<Partner, string> = {
  chloe: 'linear-gradient(180deg, #fde8d3, #f5a86b)',
  marco: 'linear-gradient(180deg, #dcebff, #8fb8f5)',
  teddy: 'linear-gradient(180deg, #f3e8ff, #c7b6ff)',
};

// 카드 뒤에 번지는 빛 — filter보다 가벼운 그라디언트로 그린다
export const PARTNER_GLOW: Record<Partner, string> = {
  chloe: 'radial-gradient(closest-side, #f5a86b, transparent)',
  marco: 'radial-gradient(closest-side, #8fb8f5, transparent)',
  teddy: 'radial-gradient(closest-side, #c7b6ff, transparent)',
};

// 글자를 읽히게 하는 카드 아래쪽 어둠
export const CARD_SHADE_CLASS =
  'bg-linear-to-b from-[#1a0f08]/0 via-[#1a0f08]/55 to-[#1a0f08]/85';
