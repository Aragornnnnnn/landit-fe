// 온보딩 첫 시나리오 소개 규칙 — 시작 버튼이 카드 속 대화 상대를 불러 "지금 이 사람과 시작한다"를 알린다
import type { Partner } from '@/features/conversation/model/character-look';
// 상대 이름의 정본은 스몰톡 상대 목록이라 가로 import한다 (카드 제목과 같은 영문 표기)
import { PARTNERS } from '@/features/small-talk/model/partner';

/** 시작 버튼이 부를 상대 이름 — 모르는 상대면 null이고 버튼은 이름 없이 첫 대화를 시작한다고 쓴다 */
export const partnerNameOf = (partner: Partner | null) =>
  PARTNERS.find((profile) => profile.id === partner)?.name ?? null;
