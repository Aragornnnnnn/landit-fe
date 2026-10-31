// 캐릭터마다 깔리는 카드 바탕색 — 내 시나리오 카드와 만들기 로딩의 섞이는 카드가 같은 색을 쓴다
import type { Partner } from '@/features/conversation/model/character-look';

// 위는 옅게, 아래로 갈수록 캐릭터 대표색에 가깝게
export const PARTNER_TINT: Record<Partner, string> = {
  chloe: 'linear-gradient(180deg, #fde8d3, #f5a86b)',
  marco: 'linear-gradient(180deg, #dcebff, #8fb8f5)',
  teddy: 'linear-gradient(180deg, #f3e8ff, #c7b6ff)',
};
