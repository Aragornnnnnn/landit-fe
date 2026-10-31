// 롤플레이 API — 백엔드(LAN-803)가 나오기 전까지 메모리 안의 가짜 저장소로 답한다.
// 함수 이름과 응답 모양은 화면이 기대는 계약이다. 스펙이 오면 이 파일만 실제 요청으로 바꾸고 응답 타입을 백엔드에 맞춘다
import type { Partner } from '@/features/conversation/model/character-look';

export interface RoleplayScenario {
  scenarioId: number;
  partner: Partner;
  myRole: string;
  partnerRole: string;
  situation: string;
  // 백엔드가 역할·상황으로 지어 주는 제목
  title: string;
  // 마지막으로 대화한 때 (LocalDateTime) — 목록 정렬 기준
  lastTalkedAt: string;
  // 이 시나리오로 한 대화 수 — 0이면 지난 대화 보기가 흐려진다
  sessionCount: number;
}

export interface RoleplayIdea {
  myRole: string;
  partnerRole: string;
  situation: string;
}

export interface CreateRoleplayScenarioBody {
  partner: Partner;
  myRole: string;
  partnerRole: string;
  situation: string;
}

export interface RoleplaySessionSummary {
  sessionId: number;
  talkedAt: string;
  turnCount: number;
  correctionCount: number;
  // 교정 없이 넘어간 턴 수 — 교정이 하나도 없을 때 「잘했어요 N개」로 보여 준다
  goodCount: number;
}

// 진짜 요청처럼 잠깐 기다린다 — 로딩 화면과 연타 잠금이 실제로 보이게
const FAKE_LATENCY_MS = 600;
// 시나리오 생성은 백엔드가 상황과 첫 마디를 만드는 시간(2~4초)을 흉내 낸다
const FAKE_CREATE_LATENCY_MS = 2800;

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const pad = (value: number) => String(value).padStart(2, '0');

// 서버가 주는 LocalDateTime과 같은 모양(2026-10-31T15:00:00)
const toLocalDateTime = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

const daysAgo = (days: number) =>
  toLocalDateTime(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

// 화면을 바로 볼 수 있게 시안의 두 장을 깔아 둔다
let scenarios: RoleplayScenario[] = [
  {
    scenarioId: 1,
    partner: 'chloe',
    myRole: '커피를 주문하는 손님',
    partnerRole: '단골 카페 바리스타',
    situation: '새로 나온 메뉴를 추천받고, 덜 달게 바꿔 달라고 하기',
    title: '단골 카페에서 새 메뉴 주문하기',
    lastTalkedAt: daysAgo(0),
    sessionCount: 3,
  },
  {
    scenarioId: 2,
    partner: 'marco',
    myRole: '짐을 찾는 여행객',
    partnerRole: '공항 수하물 직원',
    situation: '망가진 캐리어를 보여 주고 보상을 요구하기',
    title: '공항에서 망가진 캐리어 항의하기',
    lastTalkedAt: daysAgo(3),
    sessionCount: 0,
  },
];
let nextId = 3;

const IDEAS: RoleplayIdea[] = [
  {
    myRole: '커피를 주문하는 손님',
    partnerRole: '단골 카페 바리스타',
    situation: '새로 나온 메뉴를 추천받고, 덜 달게 바꿔 달라고 하기',
  },
  {
    myRole: '면접을 보는 지원자',
    partnerRole: '스타트업 면접관',
    situation: '자기소개를 하고 지원한 이유를 설명하기',
  },
  {
    myRole: '체크인하는 여행객',
    partnerRole: '호텔 프런트 직원',
    situation: '바다가 보이는 방으로 바꿔 달라고 부탁하기',
  },
  {
    myRole: '지구를 처음 소개하는 사람',
    partnerRole: '지구에 막 도착한 외계인',
    situation: '지구에서 꼭 먹어 봐야 할 음식을 추천하기',
  },
];

const byLastTalked = (a: RoleplayScenario, b: RoleplayScenario) =>
  b.lastTalkedAt.localeCompare(a.lastTalkedAt);

export const getRoleplayScenarios = async (): Promise<RoleplayScenario[]> => {
  await wait(FAKE_LATENCY_MS);
  return [...scenarios].sort(byLastTalked);
};

export const createRoleplayScenario = async (
  body: CreateRoleplayScenarioBody,
): Promise<RoleplayScenario> => {
  await wait(FAKE_CREATE_LATENCY_MS);
  // 만들자마자 대화가 시작되니, 마지막 대화는 지금이다
  const scenario: RoleplayScenario = {
    ...body,
    scenarioId: nextId++,
    title: body.situation.trim(),
    lastTalkedAt: toLocalDateTime(new Date()),
    sessionCount: 0,
  };
  scenarios = [scenario, ...scenarios];
  return scenario;
};

export const deleteRoleplayScenario = async (scenarioId: number) => {
  await wait(FAKE_LATENCY_MS);
  scenarios = scenarios.filter(
    (scenario) => scenario.scenarioId !== scenarioId,
  );
};

// 상대에 맞춘 아이디어가 필요한지는 백엔드 스펙이 오면 정한다 — 지금은 상대를 받지 않는다
export const getRoleplayIdea = async (): Promise<RoleplayIdea> => {
  await wait(FAKE_LATENCY_MS);
  return IDEAS[Math.floor(Math.random() * IDEAS.length)];
};

export const getRoleplaySessions = async (
  scenarioId: number,
): Promise<RoleplaySessionSummary[]> => {
  await wait(FAKE_LATENCY_MS);
  const scenario = scenarios.find((item) => item.scenarioId === scenarioId);
  return Array.from({ length: scenario?.sessionCount ?? 0 }, (_, index) => ({
    sessionId: scenarioId * 100 + index,
    talkedAt: daysAgo(index),
    turnCount: 7 - index,
    correctionCount: 2 - Math.min(index, 2),
    goodCount: 5 - index + Math.min(index, 2),
  }));
};
