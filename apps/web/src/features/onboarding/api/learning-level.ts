// 사용자 학습 수준 저장 — 백엔드 UserLearningLevelUpdateRequest 미러 (BE PR #119)
import { api } from '@/shared/api/client';

/** 1(막 시작)~5(유창) 정수 척도를 저장한다. 반복 호출하면 마지막 값으로 덮어쓴다 */
export const updateLearningLevel = (learningLevel: number) =>
  api.put<null>('/api/v1/me/learning-level', { learningLevel });
