// 영어 수준 선택지와 저장 — 기기(다시 묻지 않기)와 서버(맞춤 학습, BE PR #119)에 함께 남긴다.
// 값은 서버 계약과 같은 1(막 시작)~5(유창) 정수 하나로 통일한다
import type { EnglishLevel } from '@landit/analytics';

import { reportWarning } from '@/shared/monitoring/report';

import { updateLearningLevel } from '../api/learning-level';

const STORAGE_KEY = 'landit-english-level';

export const ENGLISH_LEVELS: { level: EnglishLevel; label: string }[] = [
  { level: 1, label: '영어를 이제 막 배우기 시작했어요' },
  { level: 2, label: '단어를 조합해서 말할 수 있어요' },
  { level: 3, label: '기본적인 문장으로 대화할 수 있어요' },
  { level: 4, label: '다양한 숙어 및 문법 규칙을 적용할 수 있어요' },
  { level: 5, label: '외국 학교의 수업에서 영어로 토론할 수 있어요' },
];

export const hasAnsweredEnglishLevel = () => getEnglishLevel() !== null;

// 마이페이지에서 지금 값을 보여주고 바꿀 수 있게 읽는다
export const getEnglishLevel = (): EnglishLevel | null => {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return ENGLISH_LEVELS.find((item) => item.level === stored)?.level ?? null;
  } catch {
    return null;
  }
};

export const markEnglishLevelAnswered = (level: EnglishLevel) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(level));
  } catch {
    // 저장 실패 시 다음 방문에 한 번 더 물을 뿐이라 무시한다
  }

  // 서버에도 남긴다 — 실패해도 흐름을 막지 않는다.
  // 기기 기록이 남아 다시 묻지 않고, 마이페이지에서 바꿀 때 다시 실릴 기회가 있다
  updateLearningLevel(level).catch(reportWarning);
};
