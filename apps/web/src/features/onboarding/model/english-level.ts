// 영어 수준 선택지 — 값은 서버 계약과 같은 1(막 시작)~5(유창) 정수 하나로 통일한다.
// 고른 값은 서버에만 남는다 (useSaveLearningLevelMutation)
import type { EnglishLevel } from '@landit/analytics';

export const ENGLISH_LEVELS: { level: EnglishLevel; label: string }[] = [
  { level: 1, label: '영어를 이제 막 배우기 시작했어요' },
  { level: 2, label: '단어를 조합해서 말할 수 있어요' },
  { level: 3, label: '기본적인 문장으로 대화할 수 있어요' },
  { level: 4, label: '다양한 숙어 및 문법 규칙을 적용할 수 있어요' },
  { level: 5, label: '외국 학교의 수업에서 영어로 토론할 수 있어요' },
];

// 서버가 준 정수가 우리 선택지 안에 있는지 확인해 화면에 미리 골라둘 값으로 바꾼다.
// 범위 밖이면 아무것도 안 고른 채로 연다 — 없는 카드를 강조할 수는 없다
export const toEnglishLevel = (value: number | null): EnglishLevel | null =>
  ENGLISH_LEVELS.find((item) => item.level === value)?.level ?? null;
