// 영어 수준 선택지와 로컬 저장 — BE에 필드가 아직 없어(LAN-346) 우선 기기에만 남긴다.
// API가 준비되면 markEnglishLevelAnswered 안쪽만 서버 호출로 바꾸면 된다
import type { EnglishLevel } from '@landit/analytics';

const STORAGE_KEY = 'landit-english-level';

export const ENGLISH_LEVELS: { id: EnglishLevel; label: string }[] = [
  { id: 'BEGINNER', label: '영어를 이제 막 배우기 시작했어요' },
  { id: 'ELEMENTARY', label: '단어를 조합해서 말할 수 있어요' },
  { id: 'INTERMEDIATE', label: '기본적인 문장으로 대화할 수 있어요' },
  { id: 'ADVANCED', label: '다양한 숙어 및 문법 규칙을 적용할 수 있어요' },
  { id: 'FLUENT', label: '외국 학교의 수업에서 영어로 토론할 수 있어요' },
];

export const hasAnsweredEnglishLevel = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
};

export const markEnglishLevelAnswered = (level: EnglishLevel) => {
  try {
    localStorage.setItem(STORAGE_KEY, level);
  } catch {
    // 저장 실패 시 다음 방문에 한 번 더 물을 뿐이라 무시한다
  }
};
