// 롤플레이 카드 바탕색 — 만들기 로딩은 상대의 색, 내 시나리오 카드는 시나리오마다 다른 색을 쓴다
import type { Partner } from '@/features/conversation/model/character-look';

// 위는 옅게, 아래로 갈수록 캐릭터 대표색에 가깝게
export const PARTNER_TINT: Record<Partner, string> = {
  chloe: 'linear-gradient(180deg, #fde8d3, #f5a86b)',
  marco: 'linear-gradient(180deg, #dcebff, #8fb8f5)',
  teddy: 'linear-gradient(180deg, #f3e8ff, #c7b6ff)',
};

// 내 시나리오 카드 바탕 — 증명사진 스튜디오처럼 은은한 단색 파스텔이다. 인물 뒤가 조금 밝아 캐릭터가 또렷하다
const toStudioBackdrop = (center: string, edge: string) =>
  `radial-gradient(circle at 50% 38%, ${center}, ${edge} 78%)`;

export const SCENARIO_TINTS = [
  toStudioBackdrop('#d5ecfb', '#bfe0f7'),
  toStudioBackdrop('#fde0e6', '#f9cfd9'),
  toStudioBackdrop('#d8f3e6', '#c1ead6'),
  toStudioBackdrop('#e8e0fb', '#d9cdf7'),
  toStudioBackdrop('#fff1cf', '#fde8b4'),
  toStudioBackdrop('#fde4d3', '#fad3b9'),
  toStudioBackdrop('#d4f1f1', '#bce7e8'),
  toStudioBackdrop('#eceef2', '#dde0e7'),
];

// 서버에 저장하지 않으니 id로 고른다 — 다시 받거나 다른 기기에서 봐도 색이 바뀌지 않는다
export const toScenarioTint = (scenarioId: number) =>
  SCENARIO_TINTS[scenarioId % SCENARIO_TINTS.length];

// 카드 뒤에 번지는 빛 — filter보다 가벼운 그라디언트로 그린다
export const PARTNER_GLOW: Record<Partner, string> = {
  chloe: 'radial-gradient(closest-side, #f5a86b, transparent)',
  marco: 'radial-gradient(closest-side, #8fb8f5, transparent)',
  teddy: 'radial-gradient(closest-side, #c7b6ff, transparent)',
};

// 글자를 읽히게 하는 카드 아래쪽 어둠
export const CARD_SHADE_CLASS =
  'bg-linear-to-b from-[#1a0f08]/0 via-[#1a0f08]/55 to-[#1a0f08]/85';
