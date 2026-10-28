// 시나리오 대화의 음성 인식 키워드 — 캐릭터 이름에 지금 시나리오(또는 지금 질문)의 목록 하나만 더한다
import { CHARACTER_KEYTERMS } from '@/features/conversation/model/stt-keyterms';

const KOREAN_FOOD = [
  'tteokbokki',
  'bulgogi',
  'kimchi',
  'bibimbap',
  'samgyeopsal',
];

const KOREAN_CITIES = [
  'Seoul',
  'Busan',
  'Jeju',
  'Gangneung',
  'Yangyang',
  'Gyeongju',
  'Jeonju',
];

const SEOUL_PLACES = [
  'Hongdae',
  'Gyeongbokgung',
  'Myeongdong',
  'Hangang',
  'Gangnam',
  'Namsan',
  'Seongsu',
  'Gwanghwamun',
];

// 대전·대구·속초·인천·김밥과 MBTI 16유형은 한국어식 발음에서 다른 말을 이 단어로 바꿔 받아써서 넣지 않는다
// 키는 DB의 scenario_id다 — 화면의 Day 순서와 다르다
export const SCENARIO_KEYTERMS: Record<number, readonly string[]> = {
  // 유심과 관심사
  40: ['USIM', 'SIM', 'eSIM', 'SNS'],
  278: ['SNS', 'OTT'],
  101: ['MBTI'],
  117: ['Halli Galli', 'Jenga', 'Uno'],
  64: ['Coachella'],
  72: ['OTT'],
  130: ['OTT'],
  16: ['SNS'],
  163: ['SNS'],
  214: ['SNS'],
  237: ['SNS'],
  247: ['SNS'],
  // 음식과 카페
  6: KOREAN_FOOD,
  17: ['matcha'],
  34: ['kimchi'],
  41: KOREAN_FOOD,
  49: ['soju'],
  85: ['matcha'],
  110: KOREAN_FOOD,
  154: KOREAN_FOOD,
  202: ['tteokbokki'],
  226: ['paella'],
  230: ['bulgogi'],
  238: ['tteokbokki'],
  242: ['tteokbokki'],
  250: ['matcha'],
  267: ['matcha'],
  // 여행과 지역
  3: ['Hongdae', 'Seongsu', 'Gangnam', 'Hangang', 'matcha', 'SNS'],
  20: KOREAN_CITIES,
  54: KOREAN_CITIES,
  120: [...KOREAN_CITIES, 'hanok'],
  135: ['Hongdae', 'Seongsu', 'Gangnam'],
  137: ['Hongdae', 'Seongsu', 'Gangnam'],
  139: KOREAN_CITIES,
  160: ['Hangang', 'Namsan'],
  189: ['Jeju', 'Busan', 'Gangneung', 'Yangyang'],
  // 한국 명절과 문화
  175: ['Chuseok', 'hanbok'],
  268: ['Chuseok', 'hanbok', 'kimchi', 'bulgogi', 'tteokbokki'],
};

// 주제가 넓어 질문마다 따로 고르는 시나리오 — 배열 순서가 고정 질문 순서(1~3)다
export const QUESTION_KEYTERMS: Record<number, readonly (readonly string[])[]> =
  {
    // 입주 첫날 룸메이트 Marco와 첫 만남 — 자기소개·출신 / 취미 / 한국 여행지 추천
    1: [
      KOREAN_CITIES,
      ['SNS', 'OTT'],
      [
        ...SEOUL_PLACES,
        'Jeju',
        'Busan',
        'Gyeongju',
        'Jeonju',
        'hanok',
        'hanbok',
      ],
    ],
    // 한국에 처음 온 관광객 Teddy 도와주기 — 위치 안내 / 음식 추천 / 방문 팁
    215: [SEOUL_PLACES, KOREAN_FOOD, ['hanok', 'hanbok']],
  };

interface KeytermTarget {
  scenarioId: number;
  firstSpeaker: 'AI' | 'USER';
  turnIndex: number;
}

/**
 * 이번 턴에 음성 인식으로 넘길 키워드를 고른다.
 *
 * @param target.turnIndex 지금 화면의 턴 — USER 선발화면 0번은 안내 카드라 첫 질문은 1번이다
 * @returns 캐릭터 이름 + 시나리오(질문별 시나리오는 지금 질문) 목록 하나. 목록이 없으면 이름만
 */
export const scenarioKeyterms = ({
  scenarioId,
  firstSpeaker,
  turnIndex,
}: KeytermTarget): readonly string[] => {
  const byQuestion = QUESTION_KEYTERMS[scenarioId];
  const questionIndex = turnIndex - (firstSpeaker === 'USER' ? 1 : 0);
  const extra = byQuestion
    ? (byQuestion[questionIndex] ?? [])
    : (SCENARIO_KEYTERMS[scenarioId] ?? []);
  return [...CHARACTER_KEYTERMS, ...extra];
};
