// 스몰톡 API — 백엔드 free-talk 엔드포인트 미러 (백엔드는 이 기능을 free-talk으로 부른다)
// 세션 시작·제출도 전용 엔드포인트를 쓴다. 세션 타입 무관한 종료·속마음만 entities/conversation에 있다.
import { api } from '@/shared/api/client';

export interface FreeTalkTopic {
  topicId: number;
  displayName: string;
  displayOrder: number;
}

// 스몰톡 홈이 한 번에 받는 것 — 고를 주제와 오늘 남은 발화 예산
export interface FreeTalkMainResponse {
  topics: FreeTalkTopic[];
  dailySpeakingTimeLimitMs: number;
  usedSpeakingTimeMs: number;
  remainingSpeakingTimeMs: number;
  // 오늘 예산을 다 썼는지는 서버가 판정한다 — 남은 시간으로 프론트가 유추하지 않는다
  canStart: boolean;
}

export const getFreeTalkTopics = () =>
  api.get<FreeTalkMainResponse>('/api/v1/free-talk/topics');
