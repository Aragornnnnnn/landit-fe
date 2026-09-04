// 표현학습 퀴즈에서 질문을 건네는 상대 — 들어올 때마다 클로이·마르코·테디 중 한 명을 무작위로 세운다.
// 렌더 중 난수는 순수성 위반이라 호출부가 useState 초기값 등에서 한 번만 부른다
import type { Partner } from '@/features/conversation/model/character-look';

// 말풍선 옆 80×96 자리에 세울 상반신 크롭 — 자리 비율(5:6)에 맞춰 잘라야 셋 다 바닥에 붙는다.
// 홈 일러스트 크롭(portraitViewBox)은 좌우 여유가 커서 사람 둘은 폭을 좁혔고,
// 테디는 곰이라 가로로 꽉 차 있어 폭은 두고 머리 위에 빈 공간을 더해 비율을 맞췄다(다리까지 늘리지 않는다)
export const QUIZ_VIEWBOX: Record<Partner, string> = {
  chloe: '310 50 400 630',
  marco: '300 55 400 620',
  teddy: '34 -52 840 1008',
};

// 크롭 표의 키가 곧 등장 후보다 — 홈 상대 명단(PARTNERS)에 기대지 않아 홈 순서·구성이 바뀌어도 퀴즈는 그대로다
const QUIZ_PARTNERS = Object.keys(QUIZ_VIEWBOX) as Partner[];

export const pickRandomPartner = (rand: () => number = Math.random): Partner =>
  QUIZ_PARTNERS[Math.floor(rand() * QUIZ_PARTNERS.length)];

// 서로 다른 상대를 count명 뽑는다 — 복습 두 문제가 같은 얼굴로 나오지 않게. 남은 후보에서 하나씩 빼며 고른다
export const pickDistinctPartners = (
  count: number,
  rand: () => number = Math.random,
): Partner[] => {
  const remaining = [...QUIZ_PARTNERS];
  return Array.from(
    { length: Math.min(count, remaining.length) },
    () => remaining.splice(Math.floor(rand() * remaining.length), 1)[0],
  );
};
