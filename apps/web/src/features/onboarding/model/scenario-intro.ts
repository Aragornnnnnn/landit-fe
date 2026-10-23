// 온보딩 첫 시나리오 소개 규칙 — 시작 버튼이 카드 속 대화 상대를 불러 "지금 이 사람과 시작한다"를 알린다
import type { Partner } from '@/features/conversation/model/character-look';
// 상대 이름의 정본은 스몰톡 상대 목록이라 가로 import한다 (카드 제목과 같은 영문 표기)
import { PARTNERS } from '@/features/small-talk/model/partner';

// 세 상대 이름이 모두 모음으로 끝나 조사는 "와"로 고정한다
export const startLabelOf = (partner: Partner | null) => {
  const name = PARTNERS.find((profile) => profile.id === partner)?.name;
  return name ? `${name}와 대화 시작할게요!` : '첫 대화 시작할게요!';
};
