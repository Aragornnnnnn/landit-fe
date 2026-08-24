// 영어 수준 선택지와 저장 — 기기(다시 묻지 않기)와 서버(맞춤 학습, BE PR #119)에 함께 남긴다
import type { EnglishLevel } from '@landit/analytics';

import { reportWarning } from '@/shared/monitoring/report';

import { updateLearningLevel } from '../api/learning-level';

const STORAGE_KEY = 'landit-english-level';

// rank는 1(가장 쉬움)~5(가장 능숙) — BE 저장 API(learningLevel, 1~5 정수)에 그대로 실어 보낸다.
// emoji는 선택지 옆 아이콘 — 얼굴 이모지로 난이도를 한눈에 보여준다
export const ENGLISH_LEVELS: {
  id: EnglishLevel;
  label: string;
  rank: number;
  emoji: string;
}[] = [
  {
    id: 'BEGINNER',
    label: '영어를 이제 막 배우기 시작했어요',
    rank: 1,
    emoji: '👶',
  },
  {
    id: 'ELEMENTARY',
    label: '단어를 조합해서 말할 수 있어요',
    rank: 2,
    emoji: '😅',
  },
  {
    id: 'INTERMEDIATE',
    label: '기본적인 문장으로 대화할 수 있어요',
    rank: 3,
    emoji: '😎',
  },
  {
    id: 'ADVANCED',
    label: '다양한 숙어 및 문법 규칙을 적용할 수 있어요',
    rank: 4,
    emoji: '🧐',
  },
  {
    id: 'FLUENT',
    label: '외국 학교의 수업에서 영어로 토론할 수 있어요',
    rank: 5,
    emoji: '👑',
  },
];

export const hasAnsweredEnglishLevel = () => getEnglishLevel() !== null;

// 마이페이지에서 지금 값을 보여주고 바꿀 수 있게 읽는다
export const getEnglishLevel = (): EnglishLevel | null => {
  try {
    return localStorage.getItem(STORAGE_KEY) as EnglishLevel | null;
  } catch {
    return null;
  }
};

export const markEnglishLevelAnswered = (level: EnglishLevel) => {
  try {
    localStorage.setItem(STORAGE_KEY, level);
  } catch {
    // 저장 실패 시 다음 방문에 한 번 더 물을 뿐이라 무시한다
  }

  // 서버에도 rank(1~5 정수)로 남긴다 — 실패해도 흐름을 막지 않는다.
  // 기기 기록이 남아 다시 묻지 않고, 마이페이지에서 바꿀 때 다시 실릴 기회가 있다
  const rank = ENGLISH_LEVELS.find((item) => item.id === level)?.rank;
  if (rank) updateLearningLevel(rank).catch(reportWarning);
};
