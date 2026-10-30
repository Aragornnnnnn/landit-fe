// 스몰톡 첫 안내 순서 — 래디가 큰 글씨로 두 문장을 말한 뒤, 표현 프리뷰처럼 화면의 실제 자리(받은 무료 시간 알약)를 하나씩 비춘다
// 가로 import 사유: 시나리오 탭 튜토리얼과 같은 문장 조각 규칙(<em>은 금색)을 쓴다
import { partsOf, type Part } from '../../scenario/_model/tutorial-sentence';

export interface IntroSentence {
  // 문장 위 그림 — 래디 한 장이거나, 세 친구의 웃는 얼굴 셋
  image: string | 'partners';
  parts: Part[];
}

// 비추는 자리 — 받은 무료 시간 알약 하나. 캐릭터 목소리·시작 버튼은 비추지 않는다 —
// 목소리를 셋 다 들어 본 사람도 대화 시작률은 같았고(24% vs 25%), 짧을수록 좋다
export type IntroSpotlight = 'limit';

/** 래디의 문장들 — 문구 원문(t.raw)이어야 한 자씩 쓸 수 있다 */
export const introSentencesOf = (copy: {
  freeTalkBody: string;
  endingBody: string;
}): IntroSentence[] => [
  // 세 친구와 대화한다는 말에 맞춰 래디 자리에 그 셋의 얼굴을 나란히 띄운다
  { image: 'partners', parts: partsOf(copy.freeTalkBody) },
  {
    image: '/images/character/landy-wave.webp',
    parts: partsOf(copy.endingBody),
  },
];

/**
 * @param free 무료 한도가 있는 사용자인가 — 받은 무료 시간 알약을 비춘다
 * @param exhausted 한도를 다 썼는가 — 알약이 없으니 비출 게 없고, 래디의 말만 하고 확인 버튼으로 닫는다
 */
export const introSpotlightsOf = ({
  free,
  exhausted,
}: {
  free: boolean;
  exhausted: boolean;
}): IntroSpotlight[] => (free && !exhausted ? ['limit'] : []);
