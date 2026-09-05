// 사용자 학습 수준 조회·저장 — 백엔드 UserLearningLevelResponse·UserLearningLevelUpdateRequest 미러 (BE PR #119)
import { api } from '@/shared/api/client';

export interface UserLearningLevelResponse {
  // 아직 안 답한 사용자는 null이다 — 게이트가 물을지 말지를 이 값으로 가른다
  learningLevel: number | null;
}

export const getMyLearningLevel = () =>
  api.get<UserLearningLevelResponse>('/api/v1/me/learning-level');

/** 1(막 시작)~5(유창) 정수 척도를 저장한다. 반복 호출하면 마지막 값으로 덮어쓴다 */
export const updateLearningLevel = (learningLevel: number) =>
  api.put<null>('/api/v1/me/learning-level', { learningLevel });
